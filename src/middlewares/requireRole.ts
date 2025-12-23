import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { Role } from "@prisma/client";

export const requireRole = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== Role.ADMIN) {
    return res.status(403).json({ message: "Admin only" });
  }

  next();
};
