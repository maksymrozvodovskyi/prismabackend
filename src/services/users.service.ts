import { prisma } from "../prisma";
import { Role, UserStatus } from "../../prisma/generated/prisma/index";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { createHash } from "crypto";
import { cache, CacheKeys } from "../lib/cache";

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

const assertUniqueUserEmail = async (email: string) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw createHttpError(409, "User already exists");
};

export const createUser = async (data: CreateUserInput) => {
  await assertUniqueUserEmail(data.email);

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      password: hashedPassword,
      ...(data.status && { status: data.status }),
      ...(data.skype && { skype: data.skype }),
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      ...(data.dateOfBirth && {
        dateOfBirth:
          data.dateOfBirth instanceof Date
            ? data.dateOfBirth
            : new Date(data.dateOfBirth),
      }),
      ...(data.location && { location: data.location }),
      ...(data.skills && { skills: data.skills }),
    },
  });

  await cache.invalidate(CacheKeys.users.pattern.list());

  return user;
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
  status?: UserStatus[];
} = {}) => {
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        skip,
        take,
        sortOrder: sortOrder ?? null,
        sortField,
        name: name ?? null,
        role: role ?? null,
        status: status ?? null,
      }),
    )
    .digest("hex");

  const cacheKey = CacheKeys.users.list(hash);

  return await cache.users(cacheKey, async () => {
    const whereConditions: Record<string, unknown> = {};
    if (name) whereConditions.name = { contains: name, mode: "insensitive" };
    if (role) whereConditions.role = role;
    if (status && status.length > 0) whereConditions.status = { in: status };

    const sortDirection = sortOrder || "asc";

    if (sortField === "name" || sortField === "email") {
      const allUsers = await prisma.user.findMany({
        where:
          Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
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

      allUsers.sort((a, b) => {
        const aValue = a[sortField].toLowerCase();
        const bValue = b[sortField].toLowerCase();
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      });

      const paginatedUsers = allUsers.slice(skip, skip + take);

      const total = await prisma.user.count({
        where:
          Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      });

      return { users: paginatedUsers, total };
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
  });
};

export const getUserProfile = async (userId: string) => {
  const cacheKey = CacheKeys.users.profile(userId);

  return await cache.userProfile(cacheKey, async () => {
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

    if (!user) throw createHttpError(404, "User not found");

    return user;
  });
};
