import { Router } from "express";
import {
  getReportsUsers,
  getReportsCounts,
} from "../controllers/reports.controller";
import { validate } from "../middlewares/validate";
import {
  getReportsUsersQuerySchema,
  getReportsCountsQuerySchema,
} from "../schemas/reports.schema";
import { requireAuth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/isAdmin";

const router = Router();

router.get(
  "/",
  [requireAuth, isAdmin, validate(getReportsUsersQuerySchema, "query")],
  getReportsUsers,
);

router.get(
  "/counts",
  [requireAuth, isAdmin, validate(getReportsCountsQuerySchema, "query")],
  getReportsCounts,
);

export default router;
