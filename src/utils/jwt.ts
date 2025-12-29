import jwt from "jsonwebtoken";
import { Role } from "../../prisma/generated/prisma";

const SECRET_KEY = process.env.JWT_SECRET!;

export type JwtPayload = {
  id: string;
  email: string;
  role: Role;
};

export const getToken = (user: { id: string; email: string; role: Role }) => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: "1d",
  });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, SECRET_KEY) as JwtPayload;
  } catch {
    return null;
  }
};
