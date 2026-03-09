"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../models/User"));
const types_1 = require("../types");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const result = types_1.loginSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const { email, password } = result.data;
    // Find user by email
    const user = await User_1.default.findOne({ email });
    // Verify user exists and password matches
    if (user && (await (0, password_1.matchPassword)(password, user.passwordHash))) {
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: (0, jwt_1.generateToken)(user),
        });
    }
    else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});
