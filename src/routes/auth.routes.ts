import { Router } from "express";
import { login, me } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { loginSchema } from "../schemas/auth.schema";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/login", validate(loginSchema), login);

router.get("/me", requireAuth, me);

export default router;
