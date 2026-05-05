"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Dropdown routes
router.get('/dropdowns', auth_1.protect, settingsController_1.getDropdowns);
router.put('/dropdowns/:key', auth_1.protect, auth_1.adminGuard, settingsController_1.updateDropdown);
exports.default = router;
