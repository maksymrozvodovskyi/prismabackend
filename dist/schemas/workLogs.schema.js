"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamSchema = exports.getWorkLogsByTimeSchema = exports.updateWorkLogSchema = exports.createWorkLogSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../../prisma/generated/prisma");
exports.createWorkLogSchema = zod_1.z.object({
    projectId: zod_1.z.string().cuid(),
    date: zod_1.z.string().date(),
    hours: zod_1.z.number().positive(),
    activity: zod_1.z.nativeEnum(prisma_1.ActivityType),
});
exports.updateWorkLogSchema = zod_1.z
    .object({
    date: zod_1.z.string().date().optional(),
    hours: zod_1.z.number().positive().optional(),
    activity: zod_1.z.nativeEnum(prisma_1.ActivityType).optional(),
})
    .strict();
exports.getWorkLogsByTimeSchema = zod_1.z.object({
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
});
exports.userIdParamSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid(),
});
