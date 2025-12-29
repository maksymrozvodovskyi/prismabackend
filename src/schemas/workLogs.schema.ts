import { z } from "zod";
import { ActivityType } from "../../prisma/generated/prisma";

export const createWorkLogSchema = z.object({
  projectId: z.string().cuid(),
  date: z.string().date(),
  hours: z.number().positive(),
  activity: z.nativeEnum(ActivityType),
});

export const updateWorkLogSchema = z
  .object({
    date: z.string().date().optional(),
    hours: z.number().positive().optional(),
    activity: z.nativeEnum(ActivityType).optional(),
  })
  .strict();

export const getWorkLogsByTimeSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().cuid(),
});

export type CreateWorkLogDto = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogDto = z.infer<typeof updateWorkLogSchema>;
export type GetWorkLogsByTimeQuery = z.infer<typeof getWorkLogsByTimeSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
