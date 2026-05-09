"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../utils/cache");
const background_1 = require("../utils/background");
const router = express_1.default.Router();
// Dropdown routes
router.get('/dropdowns', auth_1.protect, settingsController_1.getDropdowns);
router.put('/dropdowns/:key', auth_1.protect, auth_1.adminGuard, settingsController_1.updateDropdown);
// Cache Monitoring
router.get('/cache-stats', auth_1.protect, auth_1.adminGuard, (req, res) => {
    res.json({
        cache: (0, cache_1.getCacheStats)(),
        background: (0, background_1.getBGStats)(),
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        },
        uptime: Math.round(process.uptime()) + 's',
        pid: process.pid,
    });
});
exports.default = router;
