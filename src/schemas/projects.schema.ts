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

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const getProjectsQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(ProjectStatus).optional(),
  sortField: z.enum(["name", "status"]).optional().default("name"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type AddUserToProjectDto = z.infer<typeof addUserToProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
export type GetProjectsFiltersDto = z.infer<typeof getProjectsQuerySchema>;
