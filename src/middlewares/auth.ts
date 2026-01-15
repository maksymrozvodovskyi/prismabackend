import { Request, Response, NextFunction } from "express";
import { verifyToken, verifyResetToken } from "../utils/jwt";
import { Role } from "../../prisma/generated/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

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

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Not authorized" });
  }

  req.userId = payload.id;
  req.userRole = payload.role;

  next();
};

export const requireResetToken = async (
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

  const payload = verifyResetToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired reset token" });
  }

  req.userId = payload.id;

  next();
};
