import { Response, NextFunction } from "express";
import * as workLogService from "../services/workLogs.service";
import {
  CreateWorkLogDtoType,
  GetWorkLogsByTimeQueryType,
  UpdateWorkLogDtoType,
} from "../schemas/workLogs.schema";
import { AuthRequest } from "../middlewares/auth";
import { prisma } from "../prisma";

export const createWorkLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const dto = req.body as CreateWorkLogDtoType;

  try {
    const workLog = await workLogService.createWorkLog(req.userId!, dto);

    return res.status(201).json(workLog);
  } catch (err) {
    next(err);
  }
};

export const getWorkLogsByProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ message: "ProjectId required" });
  }

  try {
    const logs = await workLogService.getWorkLogsByProject(
      req.userId!,
      projectId
    );

    return res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};

export const getWorkLogsByUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "UserId required" });
  }

  try {
    const logs = await workLogService.getWorkLogsByUser(userId);

    return res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};

export const updateWorkLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const workLogId = req.params.workLogId;
    const userId = req.userId!;

    const workLog = await prisma.workLog.findUnique({
      where: { id: workLogId },
    });

    if (!workLog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (workLog.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: cannot update others' work logs" });
    }

    const data: Partial<UpdateWorkLogDtoType> = req.body;

    if (req.body.date !== undefined) data.date = req.body.date;

    if (req.body.hours !== undefined) data.hours = req.body.hours;

    if (req.body.activity !== undefined) data.activity = req.body.activity;

    const updatedLog = await workLogService.updateWorkLog(workLogId, data);

    res.status(200).json(updatedLog);
  } catch (err) {
    next(err);
  }
};

export const getWorkLogsByTime = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const { startDate, endDate, type, sortOrder } =
      req.query as GetWorkLogsByTimeQueryType;

    const typeFilter = type;

    const result = await workLogService.getWorkLogsByUserId(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      typeFilter,
      sortOrder ?? "asc"
    );

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
