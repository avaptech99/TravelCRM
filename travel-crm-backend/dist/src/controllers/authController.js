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
const perfLogger_1 = require("../utils/perfLogger");
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// @desc    Auth user & get token
// @route   POST /api/auth/login
exports.loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const t = (0, perfLogger_1.createTimer)('loginUser');
    t.mark('validate');
    const result = types_1.loginSchema.safeParse(req.body);
    if (!result.success) {
        t.end({ error: 'Invalid input' });
        res.status(400);
        throw new Error('Invalid input');
    }
    const { email, password } = result.data;
    t.mark('dbQuery');
    // Find user by email - use lean() for performance and select only needed fields
    const user = await User_1.default.findOne({ email })
        .select('passwordHash name email role groups')
        .lean();
    // Verify user exists and password matches
    if (user) {
        t.mark('bcryptVerify');
        const isMatch = await (0, password_1.matchPassword)(password, user.passwordHash);
        if (isMatch) {
            t.mark('passwordUpgradeCheck');
            // Migrate to 8 rounds if currently higher
            if ((0, password_1.needsUpgrade)(user.passwordHash)) {
                const newHash = await (0, password_1.hashPassword)(password);
                await User_1.default.findByIdAndUpdate(user._id, { passwordHash: newHash });
                console.log(`[AUTH] Upgraded password hash rounds for ${user.email}`);
            }
            // Update user's online status
            await User_1.default.findByIdAndUpdate(user._id, {
                isOnline: true,
                lastSeen: new Date()
            });
            t.end({ email: user.email, role: user.role });
            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                groups: user.groups,
                isOnline: true,
                token: (0, jwt_1.generateToken)(user),
            });
            return;
        }
    }
    t.end({ error: 'Invalid credentials' });
    res.status(401);
    throw new Error('Invalid email or password');
});
