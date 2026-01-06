import { prisma } from "../prisma";
import { CreateProjectDto } from "../schemas/projects.schema";

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

export const getAllProjects = async (skip = 0, take = 20) => {
  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    }),
    prisma.project.count(),
  ]);

  return { projects, total };
};

export const getProjectsByUser = async (
  userId: string,
  skip = 0,
  take = 20
) => {
  const where = { users: { some: { id: userId } } };

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: "desc" },
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
