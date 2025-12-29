"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, property = "body") => (req, res, next) => {
    const result = schema.safeParse(req[property]);
    if (!result.success) {
        return res.status(400).json({
            error: "Validation error",
            issues: result.error.issues,
        });
    }
    if (property === "query" || property === "params") {
        Object.assign(req[property], result.data);
    }
    else {
        req[property] = result.data;
    }
    next();
};
exports.validate = validate;
