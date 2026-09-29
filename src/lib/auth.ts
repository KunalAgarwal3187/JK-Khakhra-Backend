import jwt, { type SignOptions } from "jsonwebtoken";
import type { CookieOptions, Request, Response } from "express";
import type { UserRole } from "../generated/prisma/client.js";

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

export type AccessClaims = {
  sub: string;
  role: UserRole;
  typ: "access";
};

export type RefreshClaims = {
  sub: string;
  typ: "refresh";
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short. Set it in backend/.env");
  }
  return secret;
};

const isSecureCookie = (req: Request) =>
  process.env.NODE_ENV === "production" ||
  process.env.COOKIE_SECURE === "true" ||
  req.secure ||
  req.headers["x-forwarded-proto"] === "https";

export const cookieBase = (req: Request): CookieOptions => {
  const secure = isSecureCookie(req);
  const sameSiteEnv = (process.env.COOKIE_SAMESITE ?? "").toLowerCase();
  const sameSite =
    sameSiteEnv === "none" || sameSiteEnv === "lax" || sameSiteEnv === "strict"
      ? sameSiteEnv
      : secure
        ? "none"
        : "lax";

  return {
    httpOnly: true,
    secure: sameSite === "none" ? true : secure,
    sameSite,
    path: "/",
  };
};

export const signAccessToken = (userId: number, role: UserRole) => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES as SignOptions["expiresIn"]) ?? "15m",
  };
  return jwt.sign(
    { sub: String(userId), role, typ: "access" },
    getJwtSecret(),
    options
  );
};

export const signRefreshToken = (userId: number) => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES as SignOptions["expiresIn"]) ?? "7d",
  };
  return jwt.sign({ sub: String(userId), typ: "refresh" }, getJwtSecret(), options);
};

export const verifyToken = <T extends AccessClaims | RefreshClaims>(token: string) => {
  return jwt.verify(token, getJwtSecret()) as T;
};

export const setAuthCookies = (req: Request, res: Response, userId: number, role: UserRole) => {
  const access = signAccessToken(userId, role);
  const refresh = signRefreshToken(userId);
  const base = cookieBase(req);

  res.cookie(ACCESS_COOKIE, access, {
    ...base,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refresh, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (req: Request, res: Response) => {
  const base = cookieBase(req);
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
};

export const safeUser = (user: {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});
