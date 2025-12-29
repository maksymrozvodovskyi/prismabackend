"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDetails = exports.getUsers = exports.createUser = void 0;
const prisma_1 = require("../prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const assertUniqueUserEmail = async (email) => {
    const exists = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (exists) {
        throw new Error("User already exists");
    }
};
const createUser = async (data) => {
    await assertUniqueUserEmail(data.email);
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    return prisma_1.prisma.user.create({
        data: {
            email: data.email,
            name: data.name,
            role: data.role,
            password: hashedPassword,
        },
    });
};
exports.createUser = createUser;
const getUsers = () => {
    return prisma_1.prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });
};
exports.getUsers = getUsers;
const getUserDetails = async (userId, { startDate, endDate }) => {
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
    const projects = await prisma_1.prisma.project.findMany({
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
    const totalHours = projects.reduce((sum, project) => sum + project.workLogs.reduce((pSum, log) => pSum + log.hours, 0), 0);
    return {
        userId,
        totalHours,
        projectsCount: projects.length,
        projects,
    };
};
exports.getUserDetails = getUserDetails;
