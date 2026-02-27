import { z } from "zod";
import { ActivityType } from "../../prisma/generated/prisma";

export const getReportsQuerySchema = z
  .object({
    date: z.coerce.date().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    activity: z.preprocess(
      (val) =>
        val
          ? String(val)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : undefined,
      z
        .array(
          z.enum(
            Object.values(ActivityType) as [ActivityType, ...ActivityType[]],
          ),
        )
        .optional(),
    ),

    hours: z.preprocess(
      (val) =>
        val
          ? String(val)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : undefined,
      z.array(z.enum(["LT_8", "EQ_8", "GT_8"])).optional(),
    ),

    skip: z.coerce.number().int().min(0).default(0),
    take: z.coerce.number().int().min(1).max(100).default(20),
    onlyWithoutReport: z
      .preprocess(
        (val) => val === "true" || val === true,
        z.boolean(),
      )
      .optional(),
    sortField: z.enum(["name", "totalMinutes", "primaryStatus"]).default("name"),
    sortDirection: z.enum(["asc", "desc"]).default("asc"),
    name: z.string().trim().min(1).max(50).optional(),
  })
  .refine(
    (data) => {
      const hasSingleDate = !!data.date;
      const hasRange = !!data.startDate && !!data.endDate;

      return hasSingleDate !== hasRange;
    },
    {
      message:
        "Either 'date' or both 'startDate' and 'endDate' must be provided",
      path: ["date", "startDate", "endDate"],
    },
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "startDate cannot be later than endDate",
      path: ["startDate", "endDate"],
    },
  );

export type GetReportsFiltersDto = z.infer<typeof getReportsQuerySchema>;
