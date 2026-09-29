import { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma/client.js";
import { ACCESS_COOKIE, verifyToken, type AccessClaims } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue",
      });
    }

    const claims = verifyToken<AccessClaims>(token);
    if (claims.typ !== "access" || !claims.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(claims.sub) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    req.auth = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
    });
  }
};
