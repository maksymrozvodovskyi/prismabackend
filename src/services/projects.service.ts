import { prisma } from "../prisma";
import {
  CreateProjectDto,
  UpdateProjectDto,
  GetProjectsFiltersDto,
} from "../schemas/projects.schema";
import { Role, ProjectStatus } from "../../prisma/generated/prisma";
import { createHash } from "crypto";
import { cache, CacheKeys } from "../lib/cache";

export const createProject = async (data: CreateProjectDto, userId: string) => {
  const project = await prisma.project.create({
    data: {
      ...data,
      users: { connect: { id: userId } },
    },
  });

  await cache.invalidate(
    CacheKeys.users.pattern.profile(userId),
    CacheKeys.projects.pattern.byUser(userId),
    CacheKeys.projects.pattern.all(),
  );

  return project;
};

export const addUserToProject = async (projectId: string, userId: string) => {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { users: { connect: { id: userId } } },
    include: {
      users: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  await cache.invalidate(
    CacheKeys.projects.pattern.byProject(projectId),
    CacheKeys.users.pattern.profile(userId),
    CacheKeys.projects.pattern.byUser(userId),
    CacheKeys.projects.pattern.all(),
  );

  return project;
};

export const updateProject = async (
  projectId: string,
  data: UpdateProjectDto,
) => {
  const project = await prisma.project.update({
    where: { id: projectId },
    data,
    include: {
      users: { select: { id: true } },
    },
  });

  const patternsToInvalidate = [
    CacheKeys.projects.pattern.byProject(projectId),
    CacheKeys.projects.pattern.all(),
  ];

  for (const user of project.users) {
    patternsToInvalidate.push(CacheKeys.users.pattern.profile(user.id));
    patternsToInvalidate.push(CacheKeys.projects.pattern.byUser(user.id));
  }

  await cache.invalidate(...patternsToInvalidate);

  return project;
};

export const getProjectById = async (projectId: string, userId: string) => {
  const cacheKey = CacheKeys.projects.byId(projectId, userId);

  return await cache.projects(cacheKey, async () => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: { some: { id: userId } },
      },
    });

    return project;
  });
};

export const getAllProjects = async (filters: GetProjectsFiltersDto) => {
  const {
    skip = 0,
    take = 20,
    status,
    sortField = "name",
    sortDirection = "desc",
    search,
  } = filters;

  const hash = createHash("sha256")
    .update(
      JSON.stringify({ skip, take, status, sortField, sortDirection, search }),
    )
    .digest("hex");

  const cacheKey = CacheKeys.projects.all(hash);

  return await cache.projects(cacheKey, async () => {
    const where: any = {};
    if (status && status.length > 0) where.status = { in: status };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (sortField === "name") {
      const allProjects = await prisma.project.findMany({
        where,
        include: {
          users: { select: { id: true, email: true, name: true, role: true } },
        },
      });

      allProjects.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const comparison = aName.localeCompare(bName, undefined, {
          sensitivity: "base",
        });
        return sortDirection === "desc" ? -comparison : comparison;
      });

      const total = allProjects.length;
      const projects = allProjects.slice(skip, skip + take);

      return { projects, total };
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    orderBy[sortField] = sortDirection;

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          users: { select: { id: true, email: true, name: true, role: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total };
  });
};

export const getProjectsByUser = async (
  userId: string,
  filters: GetProjectsFiltersDto,
) => {
  const {
    skip = 0,
    take = 20,
    status,
    sortField = "name",
    sortDirection = "desc",
    search,
  } = filters;

  const hash = createHash("sha256")
    .update(
      JSON.stringify({ skip, take, status, sortField, sortDirection, search }),
    )
    .digest("hex");

  const cacheKey = CacheKeys.projects.byUser(userId, hash);

  return await cache.projects(cacheKey, async () => {
    const where: any = { users: { some: { id: userId } } };

    if (status && status.length > 0) where.status = { in: status };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    orderBy[sortField] = sortDirection;

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          users: { select: { id: true, email: true, name: true, role: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total };
  });
};

const STATUS_KEYS = Object.values(ProjectStatus);

export const getProjectsStats = async (userId: string, userRole: Role) => {
  const userFilter = { users: { some: { id: userId } } };
  const where = userRole === Role.EMPLOYEE ? userFilter : {};

  const counts = await prisma.project.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });

  const byStatus: Record<string, number> = {};
  for (const status of STATUS_KEYS) byStatus[status] = 0;

  let total = 0;
  for (const row of counts) {
    byStatus[row.status] = row._count._all;
    total += row._count._all;
  }

  return { total, byStatus };
};
