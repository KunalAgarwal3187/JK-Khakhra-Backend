import { Router } from "express";
import { getBestSellers, getProductBySlug, } from "../controllers/product.controller.js";
const router = Router();
router.get("/best-sellers", getBestSellers);
router.get("/:slug", getProductBySlug);
export default router;
