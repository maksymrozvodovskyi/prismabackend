import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
  token?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  const session = await prisma.session.findUnique({
    where: { accessToken: token },
    include: { user: true },
  });

  if (!session) return res.status(401).json({ error: "Invalid token" });

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });

    return res.status(401).json({ error: "Token expired" });
  }

  req.user = { id: session.user.id, role: session.user.role };
  req.token = token;

  next();
};
