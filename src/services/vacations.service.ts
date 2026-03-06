import { GetVacationsQueryDto } from "../schemas/vacations.schema";
import { prisma } from "../prisma";
import type { Prisma } from "../../prisma/generated/prisma";
import { ActivityType, UserStatus } from "../../prisma/generated/prisma";
import { subYears, startOfYear, addYears } from "date-fns";

export const getVacations = async (query: GetVacationsQueryDto) => {
  const { skip, take, sortBy, sortOrder, search } = query;

  const where: Prisma.UserWhereInput = {
    workLogs: { some: { activity: ActivityType.VACATION } },
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const now = new Date();
  const fromDate = subYears(startOfYear(now), 5);
  const toDate = startOfYear(addYears(now, 1));

  const [total, users, groupedStatuses] = await Promise.all([
    prisma.user.count({ where }),

    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        workLogs: {
          where: {
            activity: ActivityType.VACATION,
            date: { gte: fromDate, lt: toDate },
          },
          select: { date: true },
        },
        receivedVacationComments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, name: true } },
          },
        },
      },
    }),

    prisma.user.groupBy({
      by: ["status"],
      where,
      _count: {
        status: true,
      },
    }),
  ]);

  const stats = {
    red: 0,
    yellow: 0,
    green: 0,
    clean: 0,
  };

  groupedStatuses.forEach((item) => {
    if (item.status === UserStatus.RED) {
      stats.red = item._count.status;
    }

    if (item.status === UserStatus.YELLOW) {
      stats.yellow = item._count.status;
    }

    if (item.status === UserStatus.GREEN) {
      stats.green = item._count.status;
    }

    if (item.status === UserStatus.CLEAN) {
      stats.clean = item._count.status;
    }
  });

  const items = users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    workLogs: u.workLogs,
    lastComment: u.receivedVacationComments[0] ?? null,
  }));

  return {
    items,
    total,
    stats,
    hasNext: skip + take < total,
    hasPrev: skip > 0,
  };
};
