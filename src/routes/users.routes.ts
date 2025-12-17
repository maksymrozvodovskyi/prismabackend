import { Router } from "express";
import { createUser, getUsers } from "../controllers/users.controller";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../schemas/user.schema";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/", validate(createUserSchema), createUser);

router.get("/", requireAuth, getUsers);

export default router;
