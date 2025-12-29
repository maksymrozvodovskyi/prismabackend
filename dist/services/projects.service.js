"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectsByUser = exports.getAllProjects = exports.getProjectById = exports.addUserToProject = exports.createProject = void 0;
const prisma_1 = require("../prisma");
const createProject = (data, userId) => {
    return prisma_1.prisma.project.create({
        data: {
            ...data,
            users: {
                connect: { id: userId },
            },
        },
    });
};
exports.createProject = createProject;
const addUserToProject = (projectId, userId) => {
    return prisma_1.prisma.project.update({
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
exports.addUserToProject = addUserToProject;
const getProjectById = (projectId, userId) => {
    return prisma_1.prisma.project.findFirst({
        where: {
            id: projectId,
            users: {
                some: { id: userId },
            },
        },
    });
};
exports.getProjectById = getProjectById;
const getAllProjects = () => {
    return prisma_1.prisma.project.findMany({
        include: {
            users: {
                select: { id: true, email: true, name: true, role: true },
            },
        },
    });
};
exports.getAllProjects = getAllProjects;
const getProjectsByUser = (userId) => {
    return prisma_1.prisma.project.findMany({
        where: { users: { some: { id: userId } } },
        include: {
            users: {
                select: { id: true, email: true, name: true, role: true },
            },
        },
    });
};
exports.getProjectsByUser = getProjectsByUser;
