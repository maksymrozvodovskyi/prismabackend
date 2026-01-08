import { prisma } from "../prisma";
import {
  CreateProjectDto,
  UpdateProjectDto,
  GetProjectsFiltersDto,
} from "../schemas/projects.schema";

export const createProject = (data: CreateProjectDto, userId: string) => {
  return prisma.project.create({
    data: {
      ...data,
      users: {
        connect: { id: userId },
      },
    },
  });
};

export const addUserToProject = (projectId: string, userId: string) => {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      users: {
        connect: { id: userId },
      },
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

export const updateProject = async (
  projectId: string,
  data: UpdateProjectDto
) => {
  return prisma.project.update({
    where: { id: projectId },
    data,
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

export const getProjectById = (projectId: string, userId: string) => {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      users: {
        some: { id: userId },
      },
    },
  });
};

export const getAllProjects = async (filters: GetProjectsFiltersDto) => {
  const {
    skip = 0,
    take = 20,
    status,
    sortField = "createdAt",
    sortDirection = "desc",
    search,
  } = filters;

  const where: any = {};
  if (status) {
    where.status = status;
  }
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
        users: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total };
};

export const getProjectsByUser = async (
  userId: string,
  filters: GetProjectsFiltersDto
) => {
  const {
    skip = 0,
    take = 20,
    status,
    sortField = "createdAt",
    sortDirection = "desc",
    search,
  } = filters;
  const where: any = { users: { some: { id: userId } } };

  if (status) {
    where.status = status;
  }
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
        users: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total };
};
