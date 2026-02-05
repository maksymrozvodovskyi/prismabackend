import { z } from "zod";
import { Role, UserStatus } from "../../prisma/generated/prisma";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus).optional(),
  skype: z.string().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().date().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export const dateQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const getUsersQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(10000).default(20),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  sortField: z
    .enum(["name", "email", "createdAt", "role", "status"])
    .optional()
    .default("name"),
  name: z.string().optional(),
  userType: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type DateQueryDto = z.infer<typeof dateQuerySchema>;
export type GetUsersQueryDto = z.infer<typeof getUsersQuerySchema>;
