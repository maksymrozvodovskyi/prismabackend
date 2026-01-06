"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateQuerySchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../../prisma/generated/prisma");
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(1),
    role: zod_1.z.nativeEnum(prisma_1.Role),
});
exports.dateQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
