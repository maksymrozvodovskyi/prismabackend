import { z } from "zod";
import { Role, UserStatus } from "../../prisma/generated/prisma";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus).optional(),
});

export const dateQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const getUsersQuerySchema = z.object({
  sortOrder: z.enum(["asc", "desc"]).optional(),
  name: z.string().optional(),
  userType: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type DateQueryDto = z.infer<typeof dateQuerySchema>;
export type GetUsersQueryDto = z.infer<typeof getUsersQuerySchema>;
