import { Router } from "express";
import {
  createWorkLog,
  getWorkLogsByProject,
  getWorkLogsByUser,
} from "../controllers/workLogs.controller";
import { validate } from "../middlewares/validate";
import { createWorkLogSchema } from "../schemas/workLogs.schema";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/", requireAuth, validate(createWorkLogSchema), createWorkLog);

router.get("/project/:projectId", requireAuth, getWorkLogsByProject);

router.get("/user/:userId", requireAuth, getWorkLogsByUser);

export default router;
