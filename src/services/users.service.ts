import { prisma } from "../prisma";
import { Role, UserStatus } from "../../prisma/generated/prisma/index";
import bcrypt from "bcrypt";
import { Prisma } from "../../prisma/generated/prisma";

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

  const sortDirection = sortOrder || "asc";
  
  if (sortField === "name" || sortField === "email") {
    const allUsers = await prisma.user.findMany({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
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
      },
    });

    allUsers.sort((a, b) => {
      const aValue = a[sortField].toLowerCase();
      const bValue = b[sortField].toLowerCase();
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    const paginatedUsers = allUsers.slice(skip, skip + take);

    const usersWithProjects = await Promise.all(
      paginatedUsers.map(async (user) => {
        const projects = await prisma.project.findMany({
          where: {
            users: {
              some: {
                id: user.id,
              },
            },
          },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            createdAt: true,
          },
        });
        return {
          ...user,
          projects,
        };
      })
    );

    const total = await prisma.user.count({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
    });

    return { users: usersWithProjects, total };
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
