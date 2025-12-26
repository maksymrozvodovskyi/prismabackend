import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { LoginDto } from "../schemas/auth.schema";
import { AuthRequest } from "../middlewares/auth";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body as LoginDto;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await authService.getMe(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
