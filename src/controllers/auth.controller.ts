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
    const { email, password } = req.body as LoginDto;

    const result = await authService.login(email, password);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.userId!);

  res.json({ user });
};
