import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as vacationCommentsService from "../services/vacationComments.service";
import {
  ListVacationCommentsQueryDto,
  UserIdParamsDto,
  CreateVacationCommentBodyDto,
} from "../schemas/vacationComments.schema";

export const listVacationComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = res.locals.params as UserIdParamsDto;

    const { take, skip } = res.locals.query as ListVacationCommentsQueryDto;

    const result = await vacationCommentsService.listByUser(userId, take, skip);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const createVacationComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = res.locals.params as UserIdParamsDto;

    const { content } = res.locals.body as CreateVacationCommentBodyDto;

    const created = await vacationCommentsService.createForUser(
      userId,
      req.userId!,
      content,
    );

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};
