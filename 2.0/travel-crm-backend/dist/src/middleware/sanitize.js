"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeBody = void 0;
const xss_1 = __importDefault(require("xss"));
/**
 * Recursively sanitizes an object's string properties using the XSS library.
 */
const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? (0, xss_1.default)(obj) : obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
    }
    const sanitized = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitized[key] = sanitize(obj[key]);
        }
    }
    return sanitized;
};
/**
 * Middleware to sanitize the request body to prevent XSS attacks.
 */
const sanitizeBody = (req, res, next) => {
    if (req.body) {
        req.body = sanitize(req.body);
    }
    next();
};
exports.sanitizeBody = sanitizeBody;
