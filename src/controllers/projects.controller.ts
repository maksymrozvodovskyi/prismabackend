import { Response, NextFunction } from "express";
import * as projectService from "../services/projects.service";
import {
  CreateProjectDto,
  AddUserToProjectDto,
  UpdateProjectDto,
  getProjectsQuerySchema,
} from "../schemas/projects.schema";
import { AuthRequest } from "../middlewares/auth";
import { Role } from "../../prisma/generated/prisma";

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.createProject(
      req.body as CreateProjectDto,
      req.userId!
    );

    return res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const addUserToProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId } = req.params as { projectId: string };

  if (!projectId) {
    return res.status(400).json({ message: "ProjectId required" });
  }

  try {
    const project = await projectService.addUserToProject(
      projectId,
      req.body.userId
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId } = req.params as { projectId: string };

  if (!projectId) {
    return res.status(400).json({ message: "ProjectId required" });
  }

  try {
    const project = await projectService.getProjectById(projectId, req.userId!);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

export const getListOfProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = getProjectsQuerySchema.parse(req.query);

    const result =
      req.userRole === Role.ADMIN
        ? await projectService.getAllProjects(filters)
        : await projectService.getProjectsByUser(req.userId!, filters);

    const statistics = {
      total: result.total,
      byStatus: {
        PLANNED: 0,
        INPROGRESS: 0,
        ONHOLD: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        SUPPORT: 0,
      },
    };

    result.projects.forEach((project) => {
      if (statistics.byStatus[project.status as keyof typeof statistics.byStatus] !== undefined) {
        statistics.byStatus[project.status as keyof typeof statistics.byStatus]++;
      }
    });

    return res.status(200).json({
      data: result.projects,
      total: result.total,
      statistics,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId } = req.params as { projectId: string };

  if (!projectId) {
    return res.status(400).json({ message: "ProjectId required" });
  }

  try {
    const project = await projectService.updateProject(
      projectId,
      req.body as UpdateProjectDto
    );

    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

export const getUserProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string };

    if (!userId) {
      return res.status(400).json({ message: "UserId required" });
    }

    const filters = getProjectsQuerySchema.parse(req.query);
    const result = await projectService.getProjectsByUser(userId, filters);

    return res.status(200).json({
      data: result.projects,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
};