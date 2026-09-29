import { Router } from "express";
import { uploadImage } from "../../controllers/admin/upload.controller.js";
import { uploadImageMiddleware } from "../../middleware/uploadImage.js";

const router = Router();

// Multer validates the file first, then controller uploads to Cloudinary
router.post("/image", uploadImageMiddleware, uploadImage);

export default router;
