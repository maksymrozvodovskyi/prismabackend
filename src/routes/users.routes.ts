import { Router } from "express";
import {
  createUser,
  getUserDetails,
  getUsers,
} from "../controllers/users.controller";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../schemas/user.schema";
import { requireAuth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/isAdmin";

const router = Router();

router.post(
  "/",
  [requireAuth, isAdmin, validate(createUserSchema)],
  createUser
);

router.get("/", [requireAuth, isAdmin], getUsers);

router.get("/:userId", requireAuth, isAdmin, getUserDetails);

export default router;
