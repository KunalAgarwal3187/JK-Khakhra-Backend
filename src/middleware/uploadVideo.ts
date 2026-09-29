import multer from "multer";
import { NextFunction, Request, Response } from "express";

const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const MAX_FILE_SIZE_BYTES = 80 * 1024 * 1024; // 80 MB

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(
      new Error(
        "Invalid file type. Only MP4, WebM, MOV, AVI, and MKV videos are allowed."
      )
    );
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
});

/**
 * Multer for field name "video".
 * Validates type + size. Does NOT upload to Cloudinary — that happens in the controller on Save.
 */
export const uploadVideoMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single("video")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Video is too large. Maximum size is 80MB.",
        });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field. Use form field name "video".',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }

    if (err instanceof Error) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  });
};

/**
 * Same as above but file is optional (for update without replacing the video).
 */
export const uploadVideoOptionalMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single("video")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Video is too large. Maximum size is 80MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }

    if (err instanceof Error) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  });
};
