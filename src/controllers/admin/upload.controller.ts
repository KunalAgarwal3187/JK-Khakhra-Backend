import { Request, Response } from "express";
import { uploadBufferToCloudinary } from "../../utils/cloudinaryUpload.js";

const ALLOWED_FOLDERS = new Set(["categories", "products"]);

/**
 * POST /api/admin/upload/image
 * Expects multipart form field "image".
 * Optional body/query field "folder": "categories" | "products" (default: products)
 *
 * Flow: Multer validates file → upload to Cloudinary → return public URL
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please select or drop an image.",
      });
    }

    const folderRaw =
      (typeof req.body?.folder === "string" && req.body.folder) ||
      (typeof req.query.folder === "string" && req.query.folder) ||
      "products";

    const folder = folderRaw.toLowerCase().trim();
    if (!ALLOWED_FOLDERS.has(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder. Use "categories" or "products".',
      });
    }

    const cloudFolder =
      folder === "categories" ? "categories" : "products/admin-uploads";

    const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
      folder: cloudFolder,
      originalName: req.file.originalname,
    });

    return res.status(201).json({
      success: true,
      data: {
        url: uploaded.url,
        publicId: uploaded.publicId,
        folder,
      },
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image. Please try again.",
    });
  }
};
