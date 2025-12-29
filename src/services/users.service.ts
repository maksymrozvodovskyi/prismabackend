import { prisma } from "../prisma";
import { Role } from "../../prisma/generated/prisma";
import bcrypt from "bcrypt";

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

type DateFilter = {
  startDate?: string;
  endDate?: string;
};

const assertUniqueUserEmail = async (email: string) => {
  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    throw new Error("User already exists");
  }
};

export const createUser = async (data: CreateUserInput) => {
  await assertUniqueUserEmail(data.email);

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      password: hashedPassword,
    },
  });
};

export const getUsers = () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
};

export const getUserDetails = async (
  userId: string,
  { startDate, endDate }: DateFilter
) => {
  const dateFilter = {
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const projects = await prisma.project.findMany({
    where: {
      workLogs: {
        some: {
          userId,
          ...dateFilter,
        },
      },
    },
    select: {
      id: true,
      name: true,
      workLogs: {
        where: {
          userId,
          ...dateFilter,
        },
        select: {
          id: true,
          date: true,
          hours: true,
          activity: true,
        },
        orderBy: { date: "asc" },
      },
    },
  });

  const totalHours = projects.reduce(
    (sum, project) =>
      sum + project.workLogs.reduce((pSum, log) => pSum + log.hours, 0),
    0
  );

  return {
    userId,
    totalHours,
    projectsCount: projects.length,
    projects,
  };
};
