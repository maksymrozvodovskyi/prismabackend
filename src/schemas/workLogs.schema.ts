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

export type CreateWorkLogDto = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogDto = z.infer<typeof updateWorkLogSchema>;
