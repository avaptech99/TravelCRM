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
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const startTime = Date.now();
    const result = types_1.loginSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const { email, password } = result.data;
    // Find user by email - use lean() for performance and select only needed fields
    const dbStartTime = Date.now();
    const user = await User_1.default.findOne({ email })
        .select('passwordHash name email role permissions')
        .lean();
    const dbEndTime = Date.now();
    // Verify user exists and password matches
    if (user) {
        const bcryptStartTime = Date.now();
        const isMatch = await (0, password_1.matchPassword)(password, user.passwordHash);
        const bcryptEndTime = Date.now();
        if (isMatch) {
            const totalTime = Date.now() - startTime;
            console.log(`[LOGIN PERF] Total: ${totalTime}ms | DB: ${dbEndTime - dbStartTime}ms | Bcrypt: ${bcryptEndTime - bcryptStartTime}ms`);
            // Migrate to 8 rounds if currently higher
            if ((0, password_1.needsUpgrade)(user.passwordHash)) {
                const upgradeStart = Date.now();
                const newHash = await (0, password_1.hashPassword)(password);
                await User_1.default.findByIdAndUpdate(user._id, { passwordHash: newHash });
                console.log(`[AUTH] Upgraded password hash rounds for ${user.email} in ${Date.now() - upgradeStart}ms`);
            }
            // Update user's online status
            await User_1.default.findByIdAndUpdate(user._id, {
                isOnline: true,
                lastSeen: new Date()
            });
            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isOnline: true,
                token: (0, jwt_1.generateToken)(user),
            });
            return;
        }
    }
    res.status(401);
    throw new Error('Invalid email or password');
});
