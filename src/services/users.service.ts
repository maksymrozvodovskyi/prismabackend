import { prisma } from "../prisma";
import { Role, UserStatus } from "../../prisma/generated/prisma/index";
import bcrypt from "bcrypt";

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role: Role;
  status?: UserStatus;
  skype?: string;
  phoneNumber?: string;
  dateOfBirth?: string | Date;
  location?: string;
  skills?: string[];
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
      ...(data.status && { status: data.status }),
      ...(data.skype && { skype: data.skype }),
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      ...(data.dateOfBirth && {
        dateOfBirth: data.dateOfBirth instanceof Date
          ? data.dateOfBirth
          : new Date(data.dateOfBirth),
      }),
      ...(data.location && { location: data.location }),
      ...(data.skills && { skills: data.skills }),
    },
  });
};

export const getUsers = async ({
  skip = 0,
  take = 20,
  sortOrder,
  sortField = "name",
  name,
  role,
  status,
}: {
  skip?: number;
  take?: number;
  sortOrder?: "asc" | "desc";
  sortField?: "name" | "email" | "createdAt" | "role" | "status";
  name?: string;
  role?: Role;
  status?: UserStatus;
} = {}) => {
  const whereConditions: any = {};

  if (name) {
    whereConditions.name = {
      contains: name,
      mode: "insensitive",
    };
  }

  if (role) {
    whereConditions.role = role;
  }

  if (status) {
    whereConditions.status = status;
  }

  const orderBy: Record<string, "asc" | "desc"> = {};
  orderBy[sortField] = sortOrder || "asc";

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take,
      ...(Object.keys(whereConditions).length > 0 && {
        where: whereConditions,
      }),
      orderBy,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        skype: true,
        phoneNumber: true,
        dateOfBirth: true,
        location: true,
        skills: true,
        createdAt: true,
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.user.count({ where: whereConditions }),
  ]);

  return { users, total };
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

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      skype: true,
      phoneNumber: true,
      dateOfBirth: true,
      location: true,
      skills: true,
      createdAt: true,
      projects: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};
