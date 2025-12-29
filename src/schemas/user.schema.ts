import { z } from "zod";
import { Role } from "../../prisma/generated/prisma";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.nativeEnum(Role),
});

export const dateQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type DateQueryDto = z.infer<typeof dateQuerySchema>;
