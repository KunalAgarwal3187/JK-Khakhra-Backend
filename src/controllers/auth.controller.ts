import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserRole } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
  verifyToken,
  type RefreshClaims,
} from "../lib/auth.js";
import { loginSchema, signupSchema } from "../validators/auth.validators.js";

const BCRYPT_ROUNDS = 12;
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

/** Every signup is a normal customer. Role cannot be set from the client. */
export const signup = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      });
    }

    const { name, email, password } = parsed.data;
    const phone = parsed.data.phone?.trim() ? parsed.data.phone.trim() : null;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
      select: USER_SELECT,
    });

    setAuthCookies(req, res, user.id, user.role);

    return res.status(201).json({
      success: true,
      data: user,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create account. Please try again.",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { ...USER_SELECT, passwordHash: true },
    });

    // Same message for missing user / bad password — no account enumeration
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been blocked. Contact support.",
      });
    }

    const { passwordHash: _hidden, ...safe } = user;
    setAuthCookies(req, res, user.id, user.role);

    return res.status(200).json({
      success: true,
      data: safe,
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  clearAuthCookies(req, res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.id },
      select: USER_SELECT,
    });

    if (!user || !user.isActive) {
      clearAuthCookies(req, res);
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load session",
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const claims = verifyToken<RefreshClaims>(token);
    if (claims.typ !== "refresh" || !claims.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(claims.sub) },
      select: USER_SELECT,
    });

    if (!user || !user.isActive) {
      clearAuthCookies(req, res);
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    setAuthCookies(req, res, user.id, user.role);

    return res.status(200).json({
      success: true,
      data: user,
      message: "Session refreshed",
    });
  } catch {
    clearAuthCookies(req, res);
    return res.status(401).json({
      success: false,
      message: "Refresh token expired or invalid",
    });
  }
};
