import { prisma } from "../prisma";
import createHttpError from "http-errors";

export const listByUser = async (
  targetUserId: string,
  take: number,
  skip: number,
) => {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const [total, rows] = await Promise.all([
    prisma.vacationComment.count({
      where: { targetUserId },
    }),
    prisma.vacationComment.findMany({
      where: { targetUserId },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      skip,
      select: {
        id: true,
        content: true,
        author: { select: { id: true, name: true } },
        createdAt: true,
      },
    }),
  ]);

  const hasNext = rows.length > take;
  const items = hasNext ? rows.slice(0, take) : rows;

  return {
    items,
    hasNext,
    nextSkip: skip + items.length,
    total,
  };
};

export const createForUser = async (
  targetUserId: string,
  authorId: string,
  content: string,
) => {
  if (targetUserId === authorId) {
    throw createHttpError(400, "You cannot comment yourself");
  }

  const exists = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!exists) {
    throw createHttpError(404, "User not found");
  }

  const created = await prisma.vacationComment.create({
    data: {
      targetUserId,
      authorId,
      content,
    },
    select: {
      id: true,
      content: true,
      author: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  return created;
};
