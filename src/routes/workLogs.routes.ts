import { Router } from "express";
import {
  createWorkLog,
  getWorkLogsByProject,
  getWorkLogsByUser,
  updateWorkLog,
} from "../controllers/workLogs.controller";
import { validate } from "../middlewares/validate";
import {
  createWorkLogSchema,
  updateWorkLogSchema,
} from "../schemas/workLogs.schema";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.get("/project/:projectId", requireAuth, getWorkLogsByProject);

router.get("/user/:userId", [requireAuth, requireRole], getWorkLogsByUser);

router.post("/", [requireAuth, validate(createWorkLogSchema)], createWorkLog);

router.put(
  "/:workLogId",
  [requireAuth, validate(updateWorkLogSchema)],
  updateWorkLog
);

export default router;
