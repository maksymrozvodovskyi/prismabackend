"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvVar = getEnvVar;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getEnvVar(name, defaultValue) {
    const value = process.env[name];
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    if (defaultValue !== undefined) {
        return String(defaultValue);
    }
    throw new Error(`Missing: process.env['${name}']`);
}
