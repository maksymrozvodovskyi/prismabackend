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

export const getWorkLogsByTimeSchema = z
  .object({
    startDate: z
      .string()
      .date()
      .transform((val) => new Date(val)),
    endDate: z
      .string()
      .date()
      .transform((val) => new Date(val)),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"],
  });

export type CreateWorkLogDto = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogDto = z.infer<typeof updateWorkLogSchema>;
export type GetWorkLogsByTimeQuery = z.infer<typeof getWorkLogsByTimeSchema>;
