"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const syncRoutes_1 = __importDefault(require("../routes/syncRoutes"));
const setup_1 = require("../tests/setup");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/sync', syncRoutes_1.default);
app.use(setup_1.errorHandler);
describe('Sync API', () => {
    let adminToken = '';
    let agentToken = '';
    beforeEach(() => {
        adminToken = (0, setup_1.getAuthToken)('ADMIN');
        agentToken = (0, setup_1.getAuthToken)('AGENT');
    });
    describe('GET /api/sync', () => {
        it('Returns { stats, recentBookings, notifications } shape', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/sync').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('stats');
            expect(res.body).toHaveProperty('recentBookings');
            expect(res.body).toHaveProperty('notifications');
            expect(Array.isArray(res.body.recentBookings)).toBe(true);
            expect(Array.isArray(res.body.notifications)).toBe(true);
        });
        it('Returns 401 without token', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/sync');
            expect(res.status).toBe(401);
        });
    });
});
