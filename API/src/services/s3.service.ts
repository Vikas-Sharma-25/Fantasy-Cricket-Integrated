import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { logger } from "../utils/logger";

// Initialize AWS S3 Client
// If credentials are not provided in env, AWS SDK automatically searches IAM Role on EC2
const s3Config: {
  region: string;
  credentials?: { accessKeyId: string; secretAccessKey: string };
} = {
  region: env.AWS_REGION || "ap-south-1"
};

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  };
}

export const s3Client = new S3Client(s3Config);

export interface PresignedUploadOptions {
  fileName: string;
  fileType: string;
  folder?: "avatars" | "kyc" | "banners" | "general" | string;
  isPublic?: boolean;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  fileUrl: string;
  expiresIn: number;
  isMock?: boolean;
}

/**
 * Generate a presigned S3 PUT URL for direct browser-to-S3 upload
 */
export async function getPresignedUploadUrl(
  options: PresignedUploadOptions
): Promise<PresignedUploadResult> {
  const { fileName, fileType, folder = "general", isPublic = true } = options;

  // Clean filename: remove spaces and special characters
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${folder}/${Date.now()}-${uuidv4().substring(0, 8)}-${cleanName}`;

  // If S3 bucket is not yet configured, return a mock response for seamless dev/testing
  if (!env.S3_BUCKET_NAME) {
    logger.warn("[s3.service] S3_BUCKET_NAME not configured in .env; returning simulated presigned URL");
    return {
      uploadUrl: `https://example-bucket.s3.ap-south-1.amazonaws.com/${key}?simulated=true`,
      key,
      fileUrl: `https://${env.CLOUDFRONT_DOMAIN || "cdn.fantasycricket.example"}/${key}`,
      expiresIn: 300,
      isMock: true
    };
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType
  });

  const expiresIn = 300; // 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  // Format delivery URL (CloudFront CDN edge if configured, otherwise direct S3)
  const fileUrl = env.CLOUDFRONT_DOMAIN
    ? `https://${env.CLOUDFRONT_DOMAIN}/${key}`
    : `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    key,
    fileUrl,
    expiresIn
  };
}

/**
 * Generate a presigned GET URL for private assets (e.g. KYC documents, bank proofs)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds = 900
): Promise<{ downloadUrl: string; key: string; expiresIn: number; isMock?: boolean }> {
  if (!env.S3_BUCKET_NAME) {
    return {
      downloadUrl: `https://example-bucket.s3.ap-south-1.amazonaws.com/${key}?simulated=true`,
      key,
      expiresIn: expiresInSeconds,
      isMock: true
    };
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key
  });

  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds
  });

  return {
    downloadUrl,
    key,
    expiresIn: expiresInSeconds
  };
}

/**
 * Delete media object from S3
 */
export async function deleteMediaFromS3(
  key: string
): Promise<{ success: boolean; key: string; message: string }> {
  if (!env.S3_BUCKET_NAME) {
    return {
      success: true,
      key,
      message: "Simulation: S3_BUCKET_NAME not configured, deleted locally."
    };
  }

  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key
  });

  await s3Client.send(command);

  return {
    success: true,
    key,
    message: "Object deleted successfully from S3"
  };
}

/**
 * Get CloudFront CDN URL from S3 key
 */
export function getCDNUrl(key: string): string {
  if (env.CLOUDFRONT_DOMAIN) {
    return `https://${env.CLOUDFRONT_DOMAIN}/${key}`;
  }
  if (env.S3_BUCKET_NAME) {
    return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }
  return `/${key}`;
}
