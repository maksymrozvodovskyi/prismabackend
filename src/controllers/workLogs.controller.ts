import { Request, Response, NextFunction } from "express";
import * as workLogService from "../services/workLogs.service";
import { CreateWorkLogDto } from "../schemas/workLogs.schema";
import { AuthRequest } from "../middlewares/auth";

export const createWorkLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const workLog = await workLogService.createWorkLog(req.userId!, req.body);

    res.status(201).json(workLog);
  } catch (err) {
    next(err);
  }
};

export const getWorkLogsByProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const logs = await workLogService.getWorkLogsByProject(
      req.userId!,
      req.params.projectId
    );
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

export const getWorkLogsByUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const logs = await workLogService.getWorkLogsByUser(
      req.userId!,
      req.params.userId
    );
    res.json(logs);
  } catch (err) {
    next(err);
  }
};
