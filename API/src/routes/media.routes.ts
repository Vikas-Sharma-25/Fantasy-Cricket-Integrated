import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getUploadUrl, getDownloadUrl, deleteMedia } from "../controllers/media.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Generate presigned upload URL for direct S3 upload
router.post("/upload-url", asyncHandler(getUploadUrl));

// Generate presigned download URL for private documents
router.get("/download-url", asyncHandler(getDownloadUrl));

// Securely delete uploaded media from S3 (requires authentication)
router.delete("/:key(*)", requireAuth, asyncHandler(deleteMedia));

export default router;
