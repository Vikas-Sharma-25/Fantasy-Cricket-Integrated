import { Request, Response } from "express";
import * as s3Service from "../services/s3.service";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

/**
 * Controller to request a presigned URL for browser-to-S3 upload
 */
export async function getUploadUrl(req: Request, res: Response) {
  const { fileName, fileType, folder = "avatars", isPublic = true } = req.body;

  if (!fileName || !fileType) {
    throw ApiError.badRequest("fileName and fileType are required.");
  }

  // Basic MIME type validation (images and documents)
  const allowedPrefixes = ["image/", "application/pdf"];
  const isAllowed = allowedPrefixes.some((prefix) => fileType.startsWith(prefix));
  if (!isAllowed) {
    throw ApiError.badRequest(
      `Invalid fileType "${fileType}". Only image and PDF formats are supported.`
    );
  }

  const result = await s3Service.getPresignedUploadUrl({
    fileName,
    fileType,
    folder,
    isPublic: Boolean(isPublic)
  });

  return sendSuccess(res, result, "Presigned upload URL generated successfully");
}

/**
 * Controller to request a presigned URL for private asset download
 */
export async function getDownloadUrl(req: Request, res: Response) {
  const key = req.query.key as string;

  if (!key) {
    throw ApiError.badRequest("Query parameter 'key' is required.");
  }

  const result = await s3Service.getPresignedDownloadUrl(key);
  return sendSuccess(res, result, "Presigned download URL generated successfully");
}

/**
 * Controller to delete media from S3
 */
export async function deleteMedia(req: Request, res: Response) {
  const key = (req.params.key || req.body.key) as string;

  if (!key) {
    throw ApiError.badRequest("File key is required to delete.");
  }

  const result = await s3Service.deleteMediaFromS3(key);
  return sendSuccess(res, result, "Media deleted successfully");
}
