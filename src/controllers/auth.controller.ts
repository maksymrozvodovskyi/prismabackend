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

  try {
    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getMe(req.userId!);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
