import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import {
  LoginDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
} from "../schemas/auth.schema";
import { AuthRequest } from "../middlewares/auth";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body as LoginDto;

  try {
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.userId!);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body as ForgotPasswordDto;

  try {
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyResetCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, code } = req.body as VerifyResetCodeDto;

  try {
    const result = await authService.verifyResetCode(email, code);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { newPassword } = req.body as ResetPasswordDto;

  try {
    const result = await authService.resetPassword(req.userId!, newPassword);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
