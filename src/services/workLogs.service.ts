import { ActivityType } from "../../prisma/generated/prisma";
import { prisma } from "../prisma";
import { CreateWorkLogDtoType } from "../schemas/workLogs.schema";

export const createWorkLog = async (userId: string, data: CreateWorkLogDtoType) => {
  const isSickLeave = data.activity === ActivityType.SICKLEAVE;
  const isVacation = data.activity === ActivityType.VACATION;

  const hours = isSickLeave || isVacation ? 0 : data.hours;

  if (data.projectId && !isSickLeave && !isVacation) {
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

  if (!isSickLeave && !isVacation) {
    const existingVacationSickLeave = await prisma.workLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        activity: {
          in: [ActivityType.VACATION, ActivityType.SICKLEAVE],
        },
      },
    });

    if (existingVacationSickLeave.length > 0) {
      throw new Error("Cannot add work activities on days with vacation or sick leave");
    }
  }

  if (!isSickLeave && !isVacation && hours > 0) {
    for (const date of dates) {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      const existingWorkLogs = await prisma.workLog.findMany({
        where: {
          userId,
          date: normalizedDate,
          activity: {
            notIn: [ActivityType.SICKLEAVE, ActivityType.VACATION],
          },
        },
      });

      const totalHours = existingWorkLogs.reduce((sum, log) => sum + log.hours, 0) + hours;
      
      if (totalHours > 24) {
        const dateStr = normalizedDate.toISOString().split('T')[0];
        const existingHours = existingWorkLogs.reduce((sum, log) => sum + log.hours, 0);
        throw new Error(`Total hours for ${dateStr} cannot exceed 24 hours. Existing: ${existingHours.toFixed(2)}h, Adding: ${hours.toFixed(2)}h, Total: ${totalHours.toFixed(2)}h`);
      }
    }
  }

  const workLogs = await prisma.$transaction(
    dates.map((date) =>
      prisma.workLog.create({
    data: {
      userId,
      projectId: isSickLeave || isVacation ? null : (data.projectId ?? null),
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
  data: Partial<CreateWorkLogDtoType>
) => {
  const existingLog = await prisma.workLog.findUnique({
    where: { id: workLogId },
  });

  if (!existingLog) {
    throw new Error("WorkLog not found");
  }

  const isSickLeave = data.activity === ActivityType.SICKLEAVE;
  const isVacation = data.activity === ActivityType.VACATION;

  if (data.activity && !isSickLeave && !isVacation) {
    const existingVacationSickLeave = await prisma.workLog.findMany({
      where: {
        userId: existingLog.userId,
        date: existingLog.date,
        activity: {
          in: [ActivityType.VACATION, ActivityType.SICKLEAVE],
        },
        id: { not: workLogId },
      },
    });

    if (existingVacationSickLeave.length > 0) {
      throw new Error("Cannot add work activities on days with vacation or sick leave");
    }
  }

  const updateData: any = { ...data };

  if (isSickLeave || isVacation) {
    updateData.hours = 0;
    updateData.projectId = null;
  }

  const targetDate = data.date ? new Date(data.date) : existingLog.date;
  const newHours = data.hours !== undefined ? data.hours : existingLog.hours;
  const willBeSickLeaveOrVacation = isSickLeave || isVacation || 
    (existingLog.activity === ActivityType.SICKLEAVE || existingLog.activity === ActivityType.VACATION);

  if (!willBeSickLeaveOrVacation && newHours > 0) {
    const normalizedDate = new Date(targetDate);
    normalizedDate.setHours(0, 0, 0, 0);

    const existingWorkLogs = await prisma.workLog.findMany({
      where: {
        userId: existingLog.userId,
        date: normalizedDate,
        activity: {
          notIn: [ActivityType.SICKLEAVE, ActivityType.VACATION],
        },
        id: { not: workLogId },
      },
    });

    const totalHours = existingWorkLogs.reduce((sum, log) => sum + log.hours, 0) + newHours;
    
    if (totalHours > 24) {
      const dateStr = normalizedDate.toISOString().split('T')[0];
      const existingHours = existingWorkLogs.reduce((sum, log) => sum + log.hours, 0);
      throw new Error(`Total hours for ${dateStr} cannot exceed 24 hours. Existing: ${existingHours.toFixed(2)}h, Updating to: ${newHours.toFixed(2)}h, Total: ${totalHours.toFixed(2)}h`);
    }
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
      project: { id: string; name: string } | null;
      totalHours: number;
      logs: typeof logs;
    }
  > = {};

  const vacationAndSickLeaveLogs: typeof logs = [];

  let totalUserHours = 0;

  logs.forEach((log) => {
    totalUserHours += log.hours;

    if (!log.projectId || !log.project) {
      vacationAndSickLeaveLogs.push(log);
      return;
    }

    const projectId = log.project.id;
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

  const projects = Object.values(projectsMap);

  if (vacationAndSickLeaveLogs.length > 0) {
    const vacationSickLeaveHours = vacationAndSickLeaveLogs.reduce(
      (sum, log) => sum + log.hours,
      0
    );
    projects.push({
      project: null,
      totalHours: vacationSickLeaveHours,
      logs: vacationAndSickLeaveLogs,
    });
  }

  return {
    userId,
    totalUserHours,
    projects,
  };
};
