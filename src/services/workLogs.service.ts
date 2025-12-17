import { prisma } from "../prisma";
import { CreateWorkLogDto } from "../schemas/workLogs.schema";

export const createWorkLog = async (userId: string, data: CreateWorkLogDto) => {
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

  return prisma.workLog.create({
    data: {
      userId,
      projectId: data.projectId,
      date: new Date(data.date),
      hours: data.hours,
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

export const getWorkLogsByUser = async (
  requesterId: string,
  userId: string
) => {
  if (requesterId !== userId) {
    throw new Error("Forbidden");
  }

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
