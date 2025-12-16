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

const router = Router();

router.get("/", getListOfProjects);

router.get("/:projectId", getProjectById);

router.post("/", validate(createProjectSchema), createProject);

router.post(
  "/:projectId/users",
  validate(addUserToProjectSchema),
  addUserToProject
);

export default router;
