import { z } from "zod";
import { ActivityType } from "../../prisma/generated/prisma";

export const createWorkLogSchema = z.object({
  projectId: z.string().cuid().optional(),
  date: z.string().date(),
  endDate: z.string().date().optional(),
  hours: z.number().nonnegative(),
  activity: z.nativeEnum(ActivityType),
}).refine(
  (data) => {
    if (
      data.activity === ActivityType.CODING ||
      data.activity === ActivityType.REVIEW ||
      data.activity === ActivityType.STUDING
    ) {
      return !!data.projectId;
    }
    return true;
  },
  {
    message: "projectId is required for CODING, REVIEW, and STUDING activities",
    path: ["projectId"],
  }
);

export const updateWorkLogSchema = z
  .object({
    date: z.string().date().optional(),
    hours: z.number().nonnegative().optional(),
    activity: z.nativeEnum(ActivityType).optional(),
  })
  .strict();

export const getWorkLogsByTimeSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  type: z.union([
    z.nativeEnum(ActivityType),
    z.array(z.nativeEnum(ActivityType)),
  ]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().cuid(),
});

export type CreateWorkLogDtoType = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogDtoType = z.infer<typeof updateWorkLogSchema>;
export type GetWorkLogsByTimeQueryType = z.infer<typeof getWorkLogsByTimeSchema>;
export type UserIdParamType = z.infer<typeof userIdParamSchema>;