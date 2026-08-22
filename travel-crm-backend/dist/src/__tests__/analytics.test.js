"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const analyticsRoutes_1 = __importDefault(require("../routes/analyticsRoutes"));
const setup_1 = require("../tests/setup");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/analytics', analyticsRoutes_1.default);
app.use(setup_1.errorHandler);
describe('Analytics API', () => {
    let adminToken = '';
    let agentToken = '';
    let marketerToken = '';
    beforeEach(() => {
        adminToken = (0, setup_1.getAuthToken)('ADMIN');
        agentToken = (0, setup_1.getAuthToken)('AGENT');
        marketerToken = (0, setup_1.getAuthToken)('MARKETER');
    });
    describe('Role Access', () => {
        it('All analytics routes return 200 for Admin', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/analytics/payments').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });
        it('All analytics routes return 403 for Agent and Marketer', async () => {
            const res1 = await (0, supertest_1.default)(app).get('/api/analytics/payments').set('Authorization', `Bearer ${agentToken}`);
            expect(res1.status).toBe(403);
            const res2 = await (0, supertest_1.default)(app).get('/api/analytics/agents').set('Authorization', `Bearer ${marketerToken}`);
            expect(res2.status).toBe(403);
        });
    });
    describe('GET /api/analytics/payments', () => {
        it('Returns { totalCollected, totalExpected, totalBalance }', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/analytics/payments').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalCollected');
            expect(res.body).toHaveProperty('totalExpected');
            expect(res.body).toHaveProperty('balance');
            expect(typeof res.body.totalCollected).toBe('number');
        });
    });
    describe('GET /api/analytics/agents', () => {
        it('Returns per-agent stats with conversionRate as a number', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/analytics/agents').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            if (res.body.length > 0) {
                expect(typeof res.body[0].conversionRate).toBe('number');
            }
        });
    });
});
