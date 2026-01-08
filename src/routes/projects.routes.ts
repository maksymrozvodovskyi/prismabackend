import { Router } from "express";
import {
  createProject,
  addUserToProject,
  getProjectById,
  getListOfProjects,
  updateProject,
} from "../controllers/projects.controller";
import { validate } from "../middlewares/validate";
import {
  createProjectSchema,
  addUserToProjectSchema,
  updateProjectSchema,
  getProjectsQuerySchema,
} from "../schemas/projects.schema";
import { requireAuth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/isAdmin";

const router = Router();

router.get("/", [requireAuth], getListOfProjects);

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

router.put(
  "/:projectId",
  [requireAuth, isAdmin, validate(updateProjectSchema)],
  updateProject
);

export default router;
