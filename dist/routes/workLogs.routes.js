"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workLogs_controller_1 = require("../controllers/workLogs.controller");
const validate_1 = require("../middlewares/validate");
const workLogs_schema_1 = require("../schemas/workLogs.schema");
const auth_1 = require("../middlewares/auth");
const isAdmin_1 = require("../middlewares/isAdmin");
const router = (0, express_1.Router)();
router.get("/project/:projectId", auth_1.requireAuth, workLogs_controller_1.getWorkLogsByProject);
router.get("/user/:userId", [auth_1.requireAuth, isAdmin_1.isAdmin], workLogs_controller_1.getWorkLogsByUser);
router.get("/:userId", [
    auth_1.requireAuth,
    isAdmin_1.isAdmin,
    (0, validate_1.validate)(workLogs_schema_1.userIdParamSchema, "params"),
    (0, validate_1.validate)(workLogs_schema_1.getWorkLogsByTimeSchema, "query"),
], workLogs_controller_1.getWorkLogsByTime);
router.post("/", [auth_1.requireAuth, (0, validate_1.validate)(workLogs_schema_1.createWorkLogSchema)], workLogs_controller_1.createWorkLog);
router.put("/:workLogId", [auth_1.requireAuth, (0, validate_1.validate)(workLogs_schema_1.updateWorkLogSchema)], workLogs_controller_1.updateWorkLog);
exports.default = router;
