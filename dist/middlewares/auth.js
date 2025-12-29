"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const JWT_SECRET = process.env.JWT_SECRET;
const requireAuth = async (req, res, next) => {
    const authHeader = req.get("authorization");
    if (!authHeader) {
        return res.status(401).json({ message: "Not authorized" });
    }
    const [, token] = authHeader.split(" ");
    if (!token) {
        return res.status(401).json({ message: "Not authorized" });
    }
    const payload = (0, jwt_1.verifyToken)(token);
    if (!payload) {
        return res.status(401).json({ message: "Not authorized" });
    }
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
};
exports.requireAuth = requireAuth;
