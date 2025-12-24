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
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.get("/", requireAuth, getListOfProjects); // всі адмін

router.get("/:projectId", requireAuth, getProjectById);

router.post(
  "/",
  [requireAuth, requireRole, validate(createProjectSchema)],
  createProject
);

router.post(
  "/:projectId/users",
  [requireAuth, requireRole, validate(addUserToProjectSchema)],
  addUserToProject
);

export default router;
