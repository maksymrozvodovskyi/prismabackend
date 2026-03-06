import { z } from "zod";

export const listVacationCommentsQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(50).default(10),
  skip: z.coerce.number().int().min(0).default(0),
});

export const createVacationCommentBodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const userIdParamsSchema = z.object({
  userId: z.string().cuid(),
});

export type UserIdParamsDto = z.infer<typeof userIdParamsSchema>;

export type ListVacationCommentsQueryDto = z.infer<
  typeof listVacationCommentsQuerySchema
>;
export type CreateVacationCommentBodyDto = z.infer<
  typeof createVacationCommentBodySchema
>;
