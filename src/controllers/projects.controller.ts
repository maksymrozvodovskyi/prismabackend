import { Response } from "express";
import * as projectService from "../services/projects.service";
import {
  CreateProjectDto,
  AddUserToProjectDto,
  getProjectsQuerySchema,
} from "../schemas/projects.schema";
import { AuthRequest } from "../middlewares/auth";
import { Role } from "../../prisma/generated/prisma";

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await projectService.createProject(
      req.body as CreateProjectDto,
      req.userId!
    );

    return res.status(201).json(project);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addUserToProject = async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ message: "ProjectId required" });
  }

  try {
    const project = await projectService.addUserToProject(
      projectId,
      req.userId!
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ message: "ProjectId required" });
  }

  try {
    const project = await projectService.getProjectById(projectId, req.userId!);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getListOfProjects = async (req: AuthRequest, res: Response) => {
  try {
    const filters = getProjectsQuerySchema.parse(req.query);

    const result =
      req.userRole === Role.ADMIN
        ? await projectService.getAllProjects(filters)
        : await projectService.getProjectsByUser(req.userId!, filters);

    return res.json({
      data: result.projects,
      total: result.total,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
