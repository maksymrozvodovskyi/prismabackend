import { Router } from "express";
import {
  createWorkLog,
  getWorkLogsByProject,
  getWorkLogsByUser,
} from "../controllers/workLogs.controller";
import { validate } from "../middlewares/validate";
import { createWorkLogSchema } from "../schemas/workLogs.schema";

const router = Router();

router.post("/", validate(createWorkLogSchema), createWorkLog);

router.get("/project/:projectId", getWorkLogsByProject);

router.get("/user/:userId", getWorkLogsByUser);

export default router;
