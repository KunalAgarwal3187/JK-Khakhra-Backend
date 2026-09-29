import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  reorderCategories,
  updateCategory,
  updateCategoryStatus,
} from "../../controllers/admin/categories.controller.js";

const router = Router();

router.get("/", listCategories);
router.post("/", createCategory);
router.patch("/reorder", reorderCategories);
router.put("/:id", updateCategory);
router.patch("/:id/status", updateCategoryStatus);
router.delete("/:id", deleteCategory);

export default router;
