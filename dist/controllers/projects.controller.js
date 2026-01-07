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
exports.getListOfProjects = exports.getProjectById = exports.addUserToProject = exports.createProject = void 0;
const projectService = __importStar(require("../services/projects.service"));
const projects_schema_1 = require("../schemas/projects.schema");
const prisma_1 = require("../../prisma/generated/prisma");
const createProject = async (req, res) => {
    try {
        const project = await projectService.createProject(req.body, req.userId);
        return res.status(201).json(project);
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createProject = createProject;
const addUserToProject = async (req, res) => {
    const { projectId } = req.params;
    if (!projectId) {
        return res.status(400).json({ message: "ProjectId required" });
    }
    try {
        const project = await projectService.addUserToProject(projectId, req.userId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        return res.json(project);
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.addUserToProject = addUserToProject;
const getProjectById = async (req, res) => {
    const { projectId } = req.params;
    if (!projectId) {
        return res.status(400).json({ message: "ProjectId required" });
    }
    try {
        const project = await projectService.getProjectById(projectId, req.userId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        return res.json(project);
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getProjectById = getProjectById;
const getListOfProjects = async (req, res) => {
    try {
        const { skip, take, status } = projects_schema_1.getProjectsQuerySchema.parse(req.query);
        const result = req.userRole === prisma_1.Role.ADMIN
            ? await projectService.getAllProjects(skip, take, status)
            : await projectService.getProjectsByUser(req.userId, skip, take, status);
        return res.json({
            data: result.projects,
            total: result.total,
        });
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getListOfProjects = getListOfProjects;
