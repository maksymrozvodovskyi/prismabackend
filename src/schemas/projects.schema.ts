import { z } from "zod";
import { ProjectStatus } from "../../prisma/generated/prisma";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus),
});

export const addUserToProjectSchema = z.object({
  userId: z.string().cuid(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type AddUserToProjectDto = z.infer<typeof addUserToProjectSchema>;
