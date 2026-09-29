import { NextFunction, Request, Response } from "express";
import { UserRole } from "../generated/prisma/client.js";
import { requireAuth } from "./requireAuth.js";

export type AdminIdentity = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN";
};

declare global {
  namespace Express {
    interface Request {
      admin?: AdminIdentity;
    }
  }
}

/**
 * Real JWT + ADMIN check (replaces the Phase 1 stub).
 * 1. requireAuth verifies HttpOnly access cookie and loads the user
 * 2. This middleware rejects anyone whose role is not ADMIN
 */
export const requireAdmin = [
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue",
      });
    }

    if (req.auth.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    req.admin = {
      id: req.auth.id,
      name: req.auth.name,
      email: req.auth.email,
      role: "ADMIN",
    };

    next();
  },
];
