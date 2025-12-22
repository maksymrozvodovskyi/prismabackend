import { Role } from "@prisma/client";
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
  userId: string,
  requesterRole: string
) => {
  if (requesterId !== userId && requesterRole !== "ADMIN") {
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

export const updateWorkLog = async (
  userId: string,
  workLogId: string,
  data: Partial<CreateWorkLogDto>
) => {
  const workLog = await prisma.workLog.findUnique({
    where: { id: workLogId },
  });

  if (!workLog) {
    throw new Error("WorkLog not found");
  }

  if (workLog.userId !== userId) {
    throw new Error("Forbidden: cannot update others' work logs");
  }

  return prisma.workLog.update({
    where: { id: workLogId },
    data: {
      date: data.date ? new Date(data.date) : workLog.date,
      hours: data.hours ?? workLog.hours,
      activity: data.activity ?? workLog.activity,
    },
  });
};
