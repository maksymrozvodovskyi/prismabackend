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

export const getWorkLogsByTime = async (
  startDate: Date,
  endDate: Date,
  sortOrder: "asc" | "desc" = "asc"
) => {
  const logs = await prisma.workLog.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      date: true,
      hours: true,
      activity: true,
      user: {
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      date: sortOrder,
    },
  });

  const summary: Record<string, any> = {};

  for (const log of logs) {
    const { user, project, hours } = log;

    if (!summary[user.id]) {
      summary[user.id] = {
        user,
        totalHours: 0,
        projects: {},
      };
    }

    summary[user.id].totalHours += hours;

    if (!summary[user.id].projects[project.id]) {
      summary[user.id].projects[project.id] = {
        project,
        hours: 0,
        logs: [],
      };
    }

    summary[user.id].projects[project.id].hours += hours;
    summary[user.id].projects[project.id].logs.push(log);
  }

  return { logs, summary };
};
