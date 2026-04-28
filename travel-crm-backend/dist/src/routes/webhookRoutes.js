"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhookController_1 = require("../controllers/webhookController");
const router = express_1.default.Router();
// GDMS PBX webhook (protected by HTTP Basic Auth inside the controller)
router.post('/missed-call', webhookController_1.receiveMissedCall);
// Hidden endpoint to download raw PBX logs
router.get('/pbx-logs', webhookController_1.getPbxLogs);
exports.default = router;
