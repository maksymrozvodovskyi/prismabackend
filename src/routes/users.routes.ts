import { Router } from "express";
import {
  createUser,
  getUserDetails,
  getUsers,
} from "../controllers/users.controller";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../schemas/user.schema";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.post(
  "/",
  [requireAuth, requireRole, validate(createUserSchema)],
  createUser
);

router.get("/", [requireAuth, requireRole], getUsers);

router.get("/:userId", requireAuth, requireRole, getUserDetails);

export default router;
