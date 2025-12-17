import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { LoginDto } from "../schemas/auth.scema";
import { AuthRequest } from "../middlewares/auth";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.login(req.body as LoginDto);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.user!.id);

  res.json({ user });
};

export const logout = async (req: AuthRequest, res: Response) => {
  await authService.logout(req.token!);

  res.json({ message: "Logged out" });
};
