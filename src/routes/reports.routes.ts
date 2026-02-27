import { Router } from "express";
import { isAdmin } from "../middlewares/isAdmin";
import { requireAuth } from "../middlewares/auth";
import { getReports } from "../controllers/reports.controller";

const router = Router();

router.get(
  "/",
  [requireAuth, isAdmin],
  getReports
);

export default router;
