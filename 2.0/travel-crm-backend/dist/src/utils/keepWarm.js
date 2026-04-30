"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSelfPinging = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Pings the server every 10 minutes to prevent Render's free tier from sleeping.
 * Note: An external pinger (like Cron-job.org) is still recommended for reliability.
 */
const startSelfPinging = (url) => {
    if (!url) {
        console.log('Self-pinging: No URL provided, skipping.');
        return;
    }
    console.log(`Self-pinging: Initialized for ${url}`);
    // Ping every 10 minutes (600,000 ms)
    setInterval(async () => {
        try {
            const response = await (0, node_fetch_1.default)(url);
            console.log(`Self-pinging: Pinged ${url} - Status: ${response.status}`);
        }
        catch (error) {
            console.error('Self-pinging: Error pinging server', error);
        }
    }, 600000);
};
exports.startSelfPinging = startSelfPinging;
