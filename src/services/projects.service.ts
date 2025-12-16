import { prisma } from "../prisma";
import { CreateProjectDto } from "../schemas/projects.schema";

export const createProject = (data: CreateProjectDto) => {
  return prisma.project.create({
    data,
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

export const getProject = (projectId: string) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      workLogs: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { date: "desc" },
      },
    },
  });
};
