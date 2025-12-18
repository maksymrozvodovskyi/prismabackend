import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;

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

  next();
};
