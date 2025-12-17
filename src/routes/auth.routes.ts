import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { loginSchema } from "../schemas/auth.scema";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/login", validate(loginSchema), login);

router.get("/me", requireAuth, me);

router.post("/logout", requireAuth, logout);

export default router;
