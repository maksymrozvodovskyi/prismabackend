import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET!;

export type JwtPayload = {
  id: string;
  email: string;
};

export const getToken = (user: { id: string; email: string }) => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
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
