"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.getAgents = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../models/User"));
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
