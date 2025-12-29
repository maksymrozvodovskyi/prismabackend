import { ActivityType } from "../../prisma/generated/prisma";
import { prisma } from "../prisma";
import { CreateWorkLogDto } from "../schemas/workLogs.schema";

export const createWorkLog = async (userId: string, data: CreateWorkLogDto) => {
  const isSickLeave = data.activity === ActivityType.SICKLEAVE;

  const hours = isSickLeave ? 0 : data.hours;

  const isMember = await prisma.project.findFirst({
    where: {
      id: data.projectId,
      users: {
        some: { id: userId },
      },
    },
  });

  if (!isMember) {
    throw new Error("Forbidden: user is not part of this project");
  }

  if (isSickLeave) {
    const existingWorkLog = await prisma.workLog.findFirst({
      where: {
        userId,
        date: new Date(data.date),
        hours: { gt: 0 },
      },
    });

    if (existingWorkLog) {
      throw new Error("Cannot add sick leave on a working day");
    }
  }

  return prisma.workLog.create({
    data: {
      userId,
      projectId: data.projectId,
      date: new Date(data.date),
      hours,
      activity: data.activity,
    },
  });
};

export const getWorkLogsByProject = async (
  userId: string,
  projectId: string
) => {
  const isMember = await prisma.project.findFirst({
    where: {
      id: projectId,
      users: {
        some: { id: userId },
      },
    },
  });

  if (!isMember) {
    throw new Error("Forbidden");
  }

  return prisma.workLog.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
};

export const getWorkLogsByUser = async (userId: string) => {
  return prisma.workLog.findMany({
    where: { userId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
};

export const updateWorkLog = async (
  workLogId: string,
  data: Partial<CreateWorkLogDto>
) => {
  return prisma.workLog.update({
    where: { id: workLogId },
    data,
  });
};

export const getWorkLogsByUserId = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  sortOrder: "asc" | "desc" = "asc"
) => {

  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  const logs = await prisma.workLog.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { date: sortOrder },
  });

  const projectsMap: Record<
    string,
    {
      project: { id: string; name: string };
      totalHours: number;
      logs: typeof logs;
    }
  > = {};

  let totalUserHours = 0;

  logs.forEach((log) => {
    const projectId = log.project.id;
    totalUserHours += log.hours;

    if (!projectsMap[projectId]) {
      projectsMap[projectId] = {
        project: log.project,
        totalHours: 0,
        logs: [],
      };
    }

    projectsMap[projectId].totalHours += log.hours;
    projectsMap[projectId].logs.push(log);
  });

  return {
    userId,
    totalUserHours,
    projects: Object.values(projectsMap),
  };
};
