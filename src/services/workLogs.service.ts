import { ActivityType } from "../../prisma/generated/prisma";
import { prisma } from "../prisma";
import { CreateWorkLogDto } from "../schemas/workLogs.schema";

export const createWorkLog = async (userId: string, data: CreateWorkLogDto) => {
  const isSickLeave = data.activity === ActivityType.SICKLEAVE;
  const isVacation = data.activity === ActivityType.VACATION;

  const hours = isSickLeave || isVacation ? 0 : data.hours;

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

  const startDate = new Date(data.date);
  const endDate = data.endDate ? new Date(data.endDate) : startDate;

  if (endDate < startDate) {
    throw new Error("End date cannot be earlier than start date");
  }

  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (isSickLeave || isVacation) {
    const existingWorkLogs = await prisma.workLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        hours: { gt: 0 },
      },
    });

    if (existingWorkLogs.length > 0) {
      throw new Error("Cannot add vacation/sick leave on days with working hours");
    }
  }

  const workLogs = await prisma.$transaction(
    dates.map((date) =>
      prisma.workLog.create({
    data: {
      userId,
      projectId: data.projectId,
          date,
      hours,
      activity: data.activity,
    },
      })
    )
  );

  return workLogs.length === 1 ? workLogs[0] : workLogs;
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
  const isSickLeave = data.activity === ActivityType.SICKLEAVE;
  const isVacation = data.activity === ActivityType.VACATION;

  const updateData: any = { ...data };

  if (isSickLeave || isVacation) {
    updateData.hours = 0;
  }

  return prisma.workLog.update({
    where: { id: workLogId },
    data: updateData,
  });
};

export const getWorkLogsByUserId = async (
  userId: string,
  startDate?: Date,
  endDate?: Date,
  type?: ActivityType | ActivityType[],
  sortOrder: "asc" | "desc" = "asc"
) => {

  const start = startDate ? (startDate instanceof Date ? startDate : new Date(startDate)) : undefined;
  const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : undefined;

  const logs = await prisma.workLog.findMany({
    where: {
      userId,
      ...(start && end && {
      date: {
        gte: start,
        lte: end,
      },
      }),
      ...(type && {
        activity: Array.isArray(type) 
          ? { in: type }
          : type
      }),
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
