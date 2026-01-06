"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const prisma_1 = require("../../prisma/generated/prisma");
const isAdmin = (req, res, next) => {
    if (req.userRole !== prisma_1.Role.ADMIN) {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
};
exports.isAdmin = isAdmin;
