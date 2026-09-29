import "dotenv/config";
import express from "express";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import { getHomeData } from "./controllers/home.controller.js";
import cors from "cors";
const app = express();
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
].filter((origin) => Boolean(origin));
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.get("/", getHomeData);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.get("/health", (_req, res) => {
    res.json({ ok: true, message: "Backend is running" });
});
const PORT = Number(process.env.PORT ?? 5000);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
