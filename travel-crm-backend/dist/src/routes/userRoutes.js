"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get agents is protected (available to both Admin and Agents)
router.get('/agents', auth_1.protect, userController_1.getAgents);
// Get all users (Admin only)
router.get('/', auth_1.protect, userController_1.getAllUsers);
exports.default = router;
