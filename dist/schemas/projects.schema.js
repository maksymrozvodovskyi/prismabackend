"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserToProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    description: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.ProjectStatus),
});
exports.addUserToProjectSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid(),
});
