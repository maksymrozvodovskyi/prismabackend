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
  try {
    const project = await projectService.createProject(
      req.body as CreateProjectDto,
      req.userId!
    );
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const addUserToProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body as AddUserToProjectDto;

    const project = await projectService.addUserToProject(projectId, userId);

    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await projectService.getProjectById(
      req.params.projectId,
      req.userId!
    );

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const getListOfProjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let projects;

    if (req.userRole === Role.ADMIN) {
      projects = await projectService.getAllProjects();
    } else {
      projects = await projectService.getProjectsByUser(req.userId!);
    }

    res.json(projects);
  } catch (err) {
    next(err);
  }
};
