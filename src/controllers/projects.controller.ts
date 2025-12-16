import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/projects.service";
import {
  CreateProjectDto,
  AddUserToProjectDto,
} from "../schemas/projects.schema";

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await projectService.createProject(
      req.body as CreateProjectDto
    );
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const addUserToProject = async (
  req: Request,
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const getListOfProjects = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projects = await projectService.getListOfProjects();
    res.json(projects);
  } catch (err) {
    next(err);
  }
};
