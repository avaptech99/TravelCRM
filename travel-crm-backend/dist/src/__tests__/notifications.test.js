"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const notificationRoutes_1 = __importDefault(require("../routes/notificationRoutes"));
const bookingRoutes_1 = __importDefault(require("../routes/bookingRoutes"));
const setup_1 = require("../tests/setup");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/bookings', bookingRoutes_1.default);
app.use(setup_1.errorHandler);
describe('Notifications API', () => {
    let adminToken = '';
    let agentToken = '';
    beforeEach(() => {
        adminToken = (0, setup_1.getAuthToken)('ADMIN');
        agentToken = (0, setup_1.getAuthToken)('AGENT');
    });
    describe('GET /api/notifications', () => {
        it('Returns up to 20 notifications for current user', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/notifications').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeLessThanOrEqual(20);
        });
        it('Assigning a booking creates a notification for the assigned agent', async () => {
            // Create a booking
            const bRes = await (0, supertest_1.default)(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                contactPerson: 'AssignTest',
                contactNumber: '+1234567890',
                bookingType: 'B2C'
            });
            const bookingId = bRes.body._id || bRes.body.id;
            // Assign to agent
            await (0, supertest_1.default)(app)
                .patch(`/api/bookings/${bookingId}/assign`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ assignedToUserId: setup_1.testAgentId });
            // Wait for background notification side effects to execute
            await new Promise(resolve => setImmediate(resolve));
            // Check agent notifications
            const nRes = await (0, supertest_1.default)(app).get('/api/notifications').set('Authorization', `Bearer ${agentToken}`);
            expect(nRes.status).toBe(200);
            expect(nRes.body.length).toBeGreaterThan(0);
            expect(nRes.body[0].message).toMatch(/has been assigned to you/i);
        });
    });
    describe('PUT /api/notifications/:id/read', () => {
        it('marks notification as read', async () => {
            const nRes = await (0, supertest_1.default)(app).get('/api/notifications').set('Authorization', `Bearer ${agentToken}`);
            if (nRes.body.length > 0) {
                const notifId = nRes.body[0]._id;
                const readRes = await (0, supertest_1.default)(app).put(`/api/notifications/${notifId}/read`).set('Authorization', `Bearer ${agentToken}`);
                expect(readRes.status).toBe(200);
                expect(readRes.body.isRead).toBe(true);
            }
        });
    });
});
