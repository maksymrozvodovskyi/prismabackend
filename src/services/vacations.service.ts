import { GetVacationsQueryDto } from "../schemas/vacations.schema";
import { prisma } from "../prisma";
import type { Prisma } from "../../prisma/generated/prisma";
import { ActivityType } from "../../prisma/generated/prisma";

export const getVacations = async (query: GetVacationsQueryDto) => {
  const { skip, take, sortBy, sortOrder, search } = query;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  where.workLogs = {
    some: {
      activity: ActivityType.VACATION,
    },
  };

  const [total, users] = await Promise.all([
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
        createdAt: true,
      },
    }),
  ]);

  const hasNext = skip + take < total;
  const hasPrev = skip > 0;

  return {
    items: users,
    total,
    hasNext,
    hasPrev,
  };
};
