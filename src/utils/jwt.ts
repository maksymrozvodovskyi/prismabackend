import jwt from "jsonwebtoken";
import { Role } from "../../prisma/generated/prisma";

const SECRET_KEY = process.env.JWT_SECRET!;

export type JwtPayload = {
  id: string;
  email: string;
  role: Role;
};

export type ResetTokenPayload = {
  id: string;
  type: "password_reset";
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

export const getResetToken = (userId: string) => {
  const payload: ResetTokenPayload = {
    id: userId,
    type: "password_reset",
  };

  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: "15m",
  });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, SECRET_KEY) as JwtPayload;
  } catch {
    return null;
  }
};

export const verifyResetToken = (token: string): ResetTokenPayload | null => {
  try {
    const payload = jwt.verify(token, SECRET_KEY) as ResetTokenPayload;
    if (payload.type !== "password_reset") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};
