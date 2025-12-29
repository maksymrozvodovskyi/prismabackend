"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
function notFoundHandler(_req, res, _next) {
    res.status(404).json({
        error: "Not Found",
    });
}
