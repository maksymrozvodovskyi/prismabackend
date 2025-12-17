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

const router = Router();

router.get("/", requireAuth, getListOfProjects);

router.get("/:projectId", requireAuth, getProjectById);

router.post("/", requireAuth, validate(createProjectSchema), createProject);

router.post(
  "/:projectId/users",
  requireAuth,
  validate(addUserToProjectSchema),
  addUserToProject
);

export default router;
