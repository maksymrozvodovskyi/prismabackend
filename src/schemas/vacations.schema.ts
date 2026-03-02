import z from "zod";

export const getVacationsQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),

  sortBy: z.enum(["name", "createdAt", "role"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),

  search: z.string().trim().min(1).nullable().optional(),
});

export type GetVacationsQueryDto = z.infer<typeof getVacationsQuerySchema>;
