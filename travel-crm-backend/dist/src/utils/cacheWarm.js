"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmCaches = warmCaches;
const cache_1 = require("./cache");
const User_1 = __importDefault(require("../models/User"));
async function warmCaches() {
    try {
        const agents = await User_1.default
            .find({ role: { $in: ['agent', 'manager', 'AGENT', 'MANAGER'] } })
            .select('_id name email role groups lastSeen')
            .lean();
        (0, cache_1.cacheSet)(cache_1.CK.agents(), agents, cache_1.TTL.AGENTS);
        console.log(`[CACHE] Warm-up: ${agents.length} agents cached`);
    }
    catch (err) {
        console.error('[CACHE] Warm-up failed:', err.message);
        // Non-fatal — app works without warm cache
    }
}
