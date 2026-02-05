import { z } from "zod";

export const createFeedbackSchema = z.object({
  targetUserId: z.string().min(1, "Target user is required"),
  content: z.string().min(1, "Feedback content is required").max(1000, "Feedback content is too long"),
  taggedUsers: z.array(z.string()).default([]),
});

export const getFeedbacksQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateFeedbackDto = z.infer<typeof createFeedbackSchema>;
export type GetFeedbacksQueryDto = z.infer<typeof getFeedbacksQuerySchema>;
