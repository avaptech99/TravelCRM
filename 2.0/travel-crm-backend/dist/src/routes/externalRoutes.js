"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const externalController_1 = require("../controllers/externalController");
const router = express_1.default.Router();
router.post('/lead', externalController_1.createExternalLead);
exports.default = router;
