import { Router } from "express";
import { createUser, getUsers } from "../controllers/users.controller";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../schemas/user.schema";
import { requireAuth } from "../middlewares/auth";
import { roleChecker } from "../middlewares/roleChecker";

const router = Router();

router.post(
  "/",
  requireAuth,
  roleChecker,
  validate(createUserSchema),
  createUser
);

router.get("/", requireAuth, roleChecker, getUsers);

export default router;
