import { Router } from "express";
import {
  createProject,
  addUserToProject,
  getProjectById,
  getListOfProjects,
} from "../controllers/projects.controller";
import { validate } from "../middlewares/validate";
import {
  createProjectSchema,
  addUserToProjectSchema,
} from "../schemas/projects.schema";
import { requireAuth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/isAdmin";

const router = Router();

router.get("/", requireAuth, getListOfProjects);

router.get("/:projectId", requireAuth, getProjectById);

router.post(
  "/",
  [requireAuth, isAdmin, validate(createProjectSchema)],
  createProject
);

router.post(
  "/:projectId/users",
  [requireAuth, isAdmin, validate(addUserToProjectSchema)],
  addUserToProject
);

export default router;
