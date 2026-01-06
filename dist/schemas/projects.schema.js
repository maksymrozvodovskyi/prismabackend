"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectsQuerySchema = exports.addUserToProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../../prisma/generated/prisma");
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    description: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(prisma_1.ProjectStatus),
});
exports.addUserToProjectSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid(),
});
exports.getProjectsQuerySchema = zod_1.z.object({
    skip: zod_1.z.coerce.number().int().min(0).default(0),
    take: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
