import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import usersRoutes from "./users.routes.js";
import categoriesRoutes from "./categories.routes.js";
import productsRoutes from "./products.routes.js";
import uploadRoutes from "./upload.routes.js";
import videosRoutes from "./videos.routes.js";

const router = Router();

router.use(...requireAdmin);

router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/videos", videosRoutes);
router.use("/upload", uploadRoutes);

export default router;
