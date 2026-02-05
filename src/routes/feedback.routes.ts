import { Router } from "express";
import {
  createFeedback,
  getMyFeedbacks,
  getFeedbackById,
} from "../controllers/feedback.controller";
import { validate } from "../middlewares/validate";
import { createFeedbackSchema, getFeedbacksQuerySchema } from "../schemas/feedback.schema";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", [requireAuth, validate(getFeedbacksQuerySchema, "query")], getMyFeedbacks);

router.get("/:feedbackId", requireAuth, getFeedbackById);

router.post(
  "/",
  [requireAuth, validate(createFeedbackSchema)],
  createFeedback
);


export default router;