import { z } from "zod";
import { ActivityType } from "../../prisma/generated/prisma";
import { dateString, csvEnumArray } from "./schema-helpers";

export const getReportsUsersQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(10000).default(20),

  sortOrder: z.enum(["asc", "desc"]).optional(),
  sortField: z
    .enum(["name", "email", "createdAt", "role", "status"])
    .default("name"),

  name: z.string().optional(),
  date: dateString,

  activityTypes: csvEnumArray(z.nativeEnum(ActivityType)).optional(),

  hoursFilter: z.enum(["<8h", "8h", "8h>"]).optional(),
  reportType: z.enum(["missed", "work", "special", "overtime"]).optional(),
});

export type GetReportsUsersQueryDto = z.infer<
  typeof getReportsUsersQuerySchema
>;

const countsSingleDateSchema = z.object({
  date: dateString,
});

const countsRangeSchema = z
  .object({
    startDate: dateString,
    endDate: dateString,
  })
  .refine((d) => new Date(d.startDate) <= new Date(d.endDate), {
    message: "startDate must be before or equal to endDate",
  });

export const getReportsCountsQuerySchema = z.union([
  countsSingleDateSchema,
  countsRangeSchema,
]);

export type GetReportsCountsQueryDto = z.infer<
  typeof getReportsCountsQuerySchema
>;
