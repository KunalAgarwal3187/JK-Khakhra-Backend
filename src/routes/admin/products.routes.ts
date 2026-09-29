import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
  updateProductBestSeller,
  updateProductStatus,
} from "../../controllers/admin/products.controller.js";

const router = Router();

router.get("/", listProducts);
router.post("/", createProduct);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.patch("/:id/status", updateProductStatus);
router.patch("/:id/best-seller", updateProductBestSeller);
router.delete("/:id", deleteProduct);

export default router;
