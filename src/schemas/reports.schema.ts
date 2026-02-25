import { z } from "zod";
import { ActivityType } from "../../prisma/generated/prisma";

export const getReportsQuerySchema = z.object({
  date: z.coerce.date(),
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
    z
      .array(z.enum(["LT_8", "EQ_8", "GT_8"]))
      .optional(),
  ),

  skip: z.coerce.number().int().min(0).optional().default(0),
  take: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortField: z.enum(["name", "totalMinutes", "status"]).default("name"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  name: z.string().trim().min(1).max(50).optional(),
});

export type GetReportsFiltersDto = z.infer<typeof getReportsQuerySchema>;
