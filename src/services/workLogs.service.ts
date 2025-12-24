import { ActivityType } from "../../prisma/generated/prisma";
import { prisma } from "../prisma";
import { CreateWorkLogDto } from "../schemas/workLogs.schema";

export const createWorkLog = async (userId: string, data: CreateWorkLogDto) => {
  const date = new Date(data.date);

  const hours =
    data.activity === ActivityType.SICKLEAVE ||
    data.activity === ActivityType.VACATION
      ? 0
      : data.hours;

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
      date,
      hours,
      activity: data.activity,
      isApproved: data.activity === ActivityType.VACATION ? null : undefined,
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
