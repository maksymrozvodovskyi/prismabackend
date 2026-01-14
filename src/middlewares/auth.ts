import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { Role } from "../../prisma/generated/prisma";
import { prisma } from "../prisma";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklistedToken = await prisma.tokenBlacklist.findUnique({
    where: { token },
  });

  if (!blacklistedToken) {
    return false;
  }

  if (blacklistedToken.expiresAt < new Date()) {
    await prisma.tokenBlacklist.delete({
      where: { token },
    });
    return false;
  }

  return true;
};

export const addTokenToBlacklist = async (
  token: string,
  expiresAt: Date
): Promise<void> => {
  try {
    await prisma.tokenBlacklist.create({
      data: {
        token,
        expiresAt,
      },
    });
  } catch (error) {
    throw new Error("Failed to add token to blacklist");
  }
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.get("authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const isBlacklisted = await isTokenBlacklisted(token);
  if (isBlacklisted) {
    return res.status(401).json({ message: "Token has been invalidated" });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Not authorized" });
  }

  req.userId = payload.id;
  req.userRole = payload.role;

  next();
};
