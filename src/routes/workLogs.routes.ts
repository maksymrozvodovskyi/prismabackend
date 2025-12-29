import { Router } from "express";
import {
  createWorkLog,
  getWorkLogsByProject,
  getWorkLogsByUser,
  getWorkLogsByTime,
  updateWorkLog,
} from "../controllers/workLogs.controller";
import { validate } from "../middlewares/validate";
import {
  createWorkLogSchema,
  getWorkLogsByTimeSchema,
  updateWorkLogSchema,
  userIdParamSchema,
} from "../schemas/workLogs.schema";
import { requireAuth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/isAdmin";

const router = Router();

router.get("/project/:projectId", requireAuth, getWorkLogsByProject);

router.get("/user/:userId", [requireAuth, isAdmin], getWorkLogsByUser);

router.get(
  "/:userId",
  [
    requireAuth,
    isAdmin,
    validate(userIdParamSchema, "params"),
    validate(getWorkLogsByTimeSchema, "query"),
  ],
  getWorkLogsByTime
);

router.post("/", [requireAuth, validate(createWorkLogSchema)], createWorkLog);

router.put(
  "/:workLogId",
  [requireAuth, validate(updateWorkLogSchema)],
  updateWorkLog
);

export default router;
