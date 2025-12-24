import { Request, Response, NextFunction } from "express";
import * as workLogService from "../services/workLogs.service";
import { CreateWorkLogDto, UpdateWorkLogDto } from "../schemas/workLogs.schema";
import { AuthRequest } from "../middlewares/auth";
import { prisma } from "../prisma";

export const createWorkLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const workLog = await workLogService.createWorkLog(
      req.userId!,
      req.body as CreateWorkLogDto
    );

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
    const { userId } = req.params;

    if (req.userId !== userId && req.userRole !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const logs = await workLogService.getWorkLogsByUser(userId);
    res.json(logs);
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

    const data: Partial<UpdateWorkLogDto> = req.body;

    if (req.body.date !== undefined) data.date = req.body.date;

    if (req.body.hours !== undefined) data.hours = req.body.hours;

    if (req.body.activity !== undefined) data.activity = req.body.activity;

    const updatedLog = await prisma.workLog.update({
      where: { id: workLogId },
      data,
    });

    res.json(updatedLog);
  } catch (err) {
    next(err);
  }
};
