import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, refresh, signup } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please wait a few minutes and try again.",
  },
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);

export default router;
