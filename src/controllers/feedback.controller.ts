import { Response, NextFunction } from "express";
import * as feedbackService from "../services/feedback.service";
import { CreateFeedbackDto, getFeedbacksQuerySchema } from "../schemas/feedback.schema";
import { AuthRequest } from "../middlewares/auth";

export const createFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dto = req.body as CreateFeedbackDto;
    const authorId = req.userId!;

    const feedback = await feedbackService.createFeedback({
      authorId,
      targetUserId: dto.targetUserId,
      content: dto.content,
      taggedUsers: dto.taggedUsers,
    });

    res.status(201).json(feedback);
  } catch (err) {
    next(err);
  }
};

export const getMyFeedbacks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const query = getFeedbacksQuerySchema.parse(req.query);

    const result = await feedbackService.getMyFeedbacks(userId, {
      skip: query.skip,
      take: query.take,
    });

    const skip = query.skip || 0;
    const nextSkip = result.hasNextPage ? skip + result.feedbacks.length : undefined;

    res.status(200).json({
      data: result.feedbacks,
      total: result.total,
      hasMore: result.hasNextPage,
      nextSkip,
    });
  } catch (err) {
    next(err);
  }
};

export const getFeedbackById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { feedbackId } = req.params as { feedbackId: string };
      
    const feedback = await feedbackService.getFeedbackById(feedbackId);
      
    res.status(200).json(feedback);
  } catch (err) {
    next(err);
  }
};