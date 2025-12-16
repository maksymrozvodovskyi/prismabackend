import { Request, Response, NextFunction } from "express";
import * as workLogService from "../services/workLogs.service";
import { CreateWorkLogDto } from "../schemas/workLogs.schema";

export const createWorkLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workLog = await workLogService.createWorkLog(
      req.body as CreateWorkLogDto
    );
    res.status(201).json(workLog);
  } catch (err) {
    next(err);
  }
};

export const getWorkLogsByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const logs = await workLogService.getWorkLogsByProject(
      req.params.projectId
    );
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

export const getWorkLogsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const logs = await workLogService.getWorkLogsByUser(req.params.userId);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};
