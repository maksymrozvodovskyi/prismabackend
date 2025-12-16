import { prisma } from "../prisma";
import { CreateWorkLogDto } from "../schemas/workLogs.schema";

export const createWorkLog = (data: CreateWorkLogDto) => {
  return prisma.workLog.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      date: new Date(data.date),
      hours: data.hours,
      activity: data.activity,
    },
  });
};

export const getWorkLogsByProject = (projectId: string) => {
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

export const getWorkLogsByUser = (userId: string) => {
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
