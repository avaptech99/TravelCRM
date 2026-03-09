"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGuard = exports.protect = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = (0, jwt_1.verifyToken)(token);
            // Check if user still exists
            const user = await User_1.default.findById(decoded.id).select('role');
            if (!user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }
            // Attach user to request
            req.user = decoded;
            next();
        }
        catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});
const adminGuard = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }
};
exports.adminGuard = adminGuard;
