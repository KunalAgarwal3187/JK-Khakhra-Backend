import multer from "multer";
import { NextFunction, Request, Response } from "express";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
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
 * Multer middleware for a single image field named "image".
 * Validates MIME type + max size (5MB) before the controller runs.
 */
export const uploadImageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image is too large. Maximum size is 5MB.",
        });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field. Use form field name "image".',
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
