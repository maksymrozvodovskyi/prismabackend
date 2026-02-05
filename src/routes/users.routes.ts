import { Router } from "express";
import {
  createUser,
  getUserDetails,
  getUserProfile,
  getUsers,
} from "../controllers/users.controller";
import { validate } from "../middlewares/validate";
import { createUserSchema, getUsersQuerySchema } from "../schemas/user.schema";
import { requireAuth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/isAdmin";

const router = Router();

router.get(
  "/",
  [requireAuth, isAdmin, validate(getUsersQuerySchema, "query")],
  getUsers
);

router.get("/:userId/profile", requireAuth, isAdmin, getUserProfile);

router.get("/:userId", requireAuth, isAdmin, getUserDetails);

router.post(
  "/",
  [requireAuth, isAdmin, validate(createUserSchema)],
  createUser
);

export default router;
