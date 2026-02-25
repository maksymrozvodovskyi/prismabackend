import { Router } from "express";
import { isAdmin } from "../middlewares/isAdmin";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { getReportsQuerySchema } from "../schemas/reports.schema";
import { getReports } from "../controllers/reports.controller";

const router = Router();

router.get(
  "/",
  [requireAuth, isAdmin, validate(getReportsQuerySchema, "query")],
  getReports
);

export default router;
