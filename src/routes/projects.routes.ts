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
import { roleChecker } from "../middlewares/roleChecker";

const router = Router();

router.get("/", requireAuth, getListOfProjects); // всі адмін

router.get("/:projectId", requireAuth, getProjectById);

router.post(
  "/",
  requireAuth,
  roleChecker,
  validate(createProjectSchema),
  createProject
);

router.post(
  "/:projectId/users",
  requireAuth,
  roleChecker,
  validate(addUserToProjectSchema),
  addUserToProject
);

export default router;
