import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import {
  LoginDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
} from "../schemas/auth.schema";
import { AuthRequest, addTokenToBlacklist } from "../middlewares/auth";
import jwt from "jsonwebtoken";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body as LoginDto;

  try {
    const result = await authService.login(email, password);
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

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body as ForgotPasswordDto;

  try {
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
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
    res.json(result);
  } catch (err: any) {
    if (err.message === "Invalid code") {
      return res.status(400).json({ message: "Invalid code" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { newPassword } = req.body as ResetPasswordDto;
  const token = req.get("authorization")?.split(" ")[1];

  try {
    const result = await authService.resetPassword(req.userId!, newPassword);

    if (token) {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      if (decoded?.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        await addTokenToBlacklist(token, expiresAt);
      }
    }

    res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
