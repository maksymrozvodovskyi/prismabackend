import { Response, NextFunction } from "express";
import * as projectService from "../services/projects.service";
import {
  CreateProjectDto,
  AddUserToProjectDto,
} from "../schemas/projects.schema";
import { AuthRequest } from "../middlewares/auth";
import { Role } from "@prisma/client";

export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const dto = req.body as CreateProjectDto;

  if (!dto.name) {
    return res.status(400).json({ message: "Project name is required" });
  }

  try {
    const project = await projectService.createProject(dto, req.userId);

    return res.status(201).json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addUserToProject = async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;
  const { userId } = req.body as AddUserToProjectDto;

  if (!projectId || !userId) {
    return res.status(400).json({ message: "ProjectId and userId required" });
  }

  try {
    const project = await projectService.addUserToProject(projectId, userId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch (err) {
    console.error(err);
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getListOfProjects = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    let projects;

    if (req.userRole === Role.ADMIN) {
      projects = await projectService.getAllProjects();
    } else {
      projects = await projectService.getProjectsByUser(req.userId);
    }

    return res.json(projects);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
