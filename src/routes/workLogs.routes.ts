import { Router } from "express";
import {
  createWorkLog,
  getWorkLogsByProject,
  getWorkLogsByUser,
  updateWorkLog,
} from "../controllers/workLogs.controller";
import { validate } from "../middlewares/validate";
import { createWorkLogSchema } from "../schemas/workLogs.schema";
import { requireAuth } from "../middlewares/auth";
import { roleChecker } from "../middlewares/roleChecker";

const router = Router();

router.get("/project/:projectId", requireAuth, getWorkLogsByProject);

router.get("/user/:userId", requireAuth, roleChecker, getWorkLogsByUser);

router.post("/", requireAuth, validate(createWorkLogSchema), createWorkLog);

router.put("/:workLogId", requireAuth, updateWorkLog);

export default router;
