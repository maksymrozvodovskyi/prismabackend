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

export const getAllProjects = () => {
  return prisma.project.findMany({
    include: {
      users: {
        select: { id: true, email: true, name: true, role: true },
      },
    },
  });
};

export const getProjectsByUser = (userId: string) => {
  return prisma.project.findMany({
    where: { users: { some: { id: userId } } },
    include: {
      users: {
        select: { id: true, email: true, name: true, role: true },
      },
    },
  });
};
