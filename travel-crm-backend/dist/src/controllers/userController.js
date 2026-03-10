"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.createUser = exports.getAllUsers = exports.getAgents = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../models/User"));
const types_1 = require("../types");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// @desc    Get all agents
// @route   GET /api/users/agents
// @access  Private (Admin & Agent)
exports.getAgents = (0, express_async_handler_1.default)(async (req, res) => {
    const agents = await User_1.default.find({ role: 'AGENT' })
        .select('name email') // id is included by default _id
        .sort({ name: 1 });
    res.json(agents);
});
// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = (0, express_async_handler_1.default)(async (req, res) => {
    const users = await User_1.default.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 });
    res.json(users);
});
// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = (0, express_async_handler_1.default)(async (req, res) => {
    const result = types_1.createUserSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400);
        throw new Error('Invalid input');
    }
    const { name, email, password, role } = result.data;
    const userExists = await User_1.default.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.default.create({
        name,
        email,
        passwordHash,
        role,
    });
    res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    });
});
// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    // Prevent deleting oneself
    if (req.user?.id === id) {
        res.status(400);
        throw new Error('Cannot delete your own account');
    }
    const user = await User_1.default.findById(id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    await User_1.default.findByIdAndDelete(id);
    res.json({ message: 'User removed successfully' });
});
