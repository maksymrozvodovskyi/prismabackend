import { z } from "zod";
import { ActivityType } from "@prisma/client";

export const createWorkLogSchema = z.object({
  userId: z.string().cuid(),
  projectId: z.string().cuid(),
  date: z.string().date(),
  hours: z.number().positive(),
  activity: z.nativeEnum(ActivityType),
});

export type CreateWorkLogDto = z.infer<typeof createWorkLogSchema>;
