"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkLogsByUserId = exports.updateWorkLog = exports.getWorkLogsByUser = exports.getWorkLogsByProject = exports.createWorkLog = void 0;
const prisma_1 = require("../../prisma/generated/prisma");
const prisma_2 = require("../prisma");
const createWorkLog = async (userId, data) => {
    const isSickLeave = data.activity === prisma_1.ActivityType.SICKLEAVE;
    const hours = isSickLeave ? 0 : data.hours;
    const isMember = await prisma_2.prisma.project.findFirst({
        where: {
            id: data.projectId,
            users: {
                some: { id: userId },
            },
        },
    });
    if (!isMember) {
        throw new Error("Forbidden: user is not part of this project");
    }
    if (isSickLeave) {
        const existingWorkLog = await prisma_2.prisma.workLog.findFirst({
            where: {
                userId,
                date: new Date(data.date),
                hours: { gt: 0 },
            },
        });
        if (existingWorkLog) {
            throw new Error("Cannot add sick leave on a working day");
        }
    }
    return prisma_2.prisma.workLog.create({
        data: {
            userId,
            projectId: data.projectId,
            date: new Date(data.date),
            hours,
            activity: data.activity,
        },
    });
};
exports.createWorkLog = createWorkLog;
const getWorkLogsByProject = async (userId, projectId) => {
    const isMember = await prisma_2.prisma.project.findFirst({
        where: {
            id: projectId,
            users: {
                some: { id: userId },
            },
        },
    });
    if (!isMember) {
        throw new Error("Forbidden");
    }
    return prisma_2.prisma.workLog.findMany({
        where: { projectId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { date: "desc" },
    });
};
exports.getWorkLogsByProject = getWorkLogsByProject;
const getWorkLogsByUser = async (userId) => {
    return prisma_2.prisma.workLog.findMany({
        where: { userId },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                },
            },
        },
        orderBy: { date: "desc" },
    });
};
exports.getWorkLogsByUser = getWorkLogsByUser;
const updateWorkLog = async (workLogId, data) => {
    return prisma_2.prisma.workLog.update({
        where: { id: workLogId },
        data,
    });
};
exports.updateWorkLog = updateWorkLog;
const getWorkLogsByUserId = async (userId, startDate, endDate, sortOrder = "asc") => {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const logs = await prisma_2.prisma.workLog.findMany({
        where: {
            userId,
            date: {
                gte: start,
                lte: end,
            },
        },
        include: {
            project: {
                select: { id: true, name: true },
            },
        },
        orderBy: { date: sortOrder },
    });
    const projectsMap = {};
    let totalUserHours = 0;
    logs.forEach((log) => {
        const projectId = log.project.id;
        totalUserHours += log.hours;
        if (!projectsMap[projectId]) {
            projectsMap[projectId] = {
                project: log.project,
                totalHours: 0,
                logs: [],
            };
        }
        projectsMap[projectId].totalHours += log.hours;
        projectsMap[projectId].logs.push(log);
    });
    return {
        userId,
        totalUserHours,
        projects: Object.values(projectsMap),
    };
};
exports.getWorkLogsByUserId = getWorkLogsByUserId;
