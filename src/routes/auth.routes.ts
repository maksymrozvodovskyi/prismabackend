import { Router } from "express";
import {
  login,
  me,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import {
  loginSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema";
import { requireAuth, requireResetToken } from "../middlewares/auth";

const router = Router();

router.post("/login", validate(loginSchema), login);

router.get("/me", requireAuth, me);

router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

router.post(
  "/verify-reset-code",
  validate(verifyResetCodeSchema),
  verifyResetCode
);

router.post(
  "/reset-password",
  requireResetToken,
  validate(resetPasswordSchema),
  resetPassword
);

export default router;
