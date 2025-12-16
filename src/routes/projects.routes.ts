import { Router } from "express";
import {
  createProject,
  addUserToProject,
  getProject,
} from "../controllers/projects.controller";
import { validate } from "../middlewares/validate";
import {
  createProjectSchema,
  addUserToProjectSchema,
} from "../schemas/projects.schema";

const router = Router();

router.post("/", validate(createProjectSchema), createProject);

router.post(
  "/:projectId/users",
  validate(addUserToProjectSchema),
  addUserToProject
);

router.get("/:projectId", getProject);

export default router;
