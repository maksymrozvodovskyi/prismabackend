"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkLogsByTime = exports.updateWorkLog = exports.getWorkLogsByUser = exports.getWorkLogsByProject = exports.createWorkLog = void 0;
const workLogService = __importStar(require("../services/workLogs.service"));
const prisma_1 = require("../prisma");
const createWorkLog = async (req, res) => {
    const dto = req.body;
    try {
        const workLog = await workLogService.createWorkLog(req.userId, dto);
        return res.status(201).json(workLog);
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createWorkLog = createWorkLog;
const getWorkLogsByProject = async (req, res) => {
    const { projectId } = req.params;
    if (!projectId) {
        return res.status(400).json({ message: "ProjectId required" });
    }
    try {
        const logs = await workLogService.getWorkLogsByProject(req.userId, projectId);
        return res.json(logs);
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getWorkLogsByProject = getWorkLogsByProject;
const getWorkLogsByUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ message: "UserId required" });
    }
    try {
        const logs = await workLogService.getWorkLogsByUser(userId);
        return res.json(logs);
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getWorkLogsByUser = getWorkLogsByUser;
const updateWorkLog = async (req, res, next) => {
    try {
        const workLogId = req.params.workLogId;
        const userId = req.userId;
        const workLog = await prisma_1.prisma.workLog.findUnique({
            where: { id: workLogId },
        });
        if (!workLog) {
            return res.status(404).json({ message: "WorkLog not found" });
        }
        if (workLog.userId !== userId) {
            return res
                .status(403)
                .json({ message: "Forbidden: cannot update others' work logs" });
        }
        const data = req.body;
        if (req.body.date !== undefined)
            data.date = req.body.date;
        if (req.body.hours !== undefined)
            data.hours = req.body.hours;
        if (req.body.activity !== undefined)
            data.activity = req.body.activity;
        const updatedLog = await prisma_1.prisma.workLog.update({
            where: { id: workLogId },
            data,
        });
        res.json(updatedLog);
    }
    catch (err) {
        next(err);
    }
};
exports.updateWorkLog = updateWorkLog;
const getWorkLogsByTime = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, sortOrder } = req.query;
        const result = await workLogService.getWorkLogsByUserId(userId, new Date(startDate), new Date(endDate), sortOrder ?? "asc");
        return res.json(result);
    }
    catch (error) {
        console.error("Error fetching work logs:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getWorkLogsByTime = getWorkLogsByTime;
