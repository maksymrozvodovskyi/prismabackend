import { Router } from "express";
import { getVacationsController } from "../controllers/vacations.controller";
import { requireAuth } from "../middlewares/auth";
import { getVacationsQuerySchema } from "../schemas/vacations.schema";
import { validate } from "../middlewares/validate";

const router = Router();

router.get(
  "/",
  [requireAuth, validate(getVacationsQuerySchema, "query")],
  getVacationsController,
);

export default router;
