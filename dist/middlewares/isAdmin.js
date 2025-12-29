"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const client_1 = require("@prisma/client");
const isAdmin = (req, res, next) => {
    if (req.userRole !== client_1.Role.ADMIN) {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
};
exports.isAdmin = isAdmin;
