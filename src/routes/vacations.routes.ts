import { Router } from "express";
import { getVacationsController } from "../controllers/vacations.controller";
import { requireAuth } from "../middlewares/auth";
import { getVacationsQuerySchema } from "../schemas/vacations.schema";
import { validate } from "../middlewares/validate";
import {
  createVacationComment,
  listVacationComments,
} from "../controllers/vacationComments.controller";
import {
  createVacationCommentBodySchema,
  listVacationCommentsQuerySchema,
  userIdParamsSchema,
} from "../schemas/vacationComments.schema";
import { isAdmin } from "../middlewares/isAdmin";

const router = Router();

router.get(
  "/",
  [requireAuth, validate(getVacationsQuerySchema, "query")],
  getVacationsController,
);

router.get(
  "/:userId/comments",
  [
    requireAuth,
    isAdmin,
    validate(userIdParamsSchema, "params"),
    validate(listVacationCommentsQuerySchema, "query"),
  ],
  listVacationComments,
);

router.post(
  "/:userId/comments",
  [
    requireAuth,
    isAdmin,
    validate(userIdParamsSchema, "params"),
    validate(createVacationCommentBodySchema, "body"),
  ],
  createVacationComment,
);

export default router;
