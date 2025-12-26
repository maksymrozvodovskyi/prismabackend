import { Response, NextFunction } from "express";
import * as workLogService from "../services/workLogs.service";
import {
  CreateWorkLogDto,
  GetWorkLogsByTimeQuery,
  UpdateWorkLogDto,
} from "../schemas/workLogs.schema";
import { AuthRequest } from "../middlewares/auth";
import { prisma } from "../prisma";

export const createWorkLog = async (req: AuthRequest, res: Response) => {
  const dto = req.body as CreateWorkLogDto;

  if (!dto.projectId || dto.hours === undefined || !dto.activity) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const workLog = await workLogService.createWorkLog(req.userId!, dto);

    return res.status(201).json(workLog);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getWorkLogsByProject = async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ message: "ProjectId required" });
  }

  try {
    const logs = await workLogService.getWorkLogsByProject(
      req.userId!,
      projectId
    );

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getWorkLogsByUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "UserId required" });
  }

  try {
    const logs = await workLogService.getWorkLogsByUser(userId);

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
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

export const getWorkLogsByTime = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, sortOrder } =
      req.query as unknown as GetWorkLogsByTimeQuery;

    const result = await workLogService.getWorkLogsByTime(
      startDate,
      endDate,
      sortOrder
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
