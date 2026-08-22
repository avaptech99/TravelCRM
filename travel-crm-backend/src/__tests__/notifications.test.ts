import request from 'supertest';
import express from 'express';
import notificationRoutes from '../routes/notificationRoutes';
import bookingRoutes from '../routes/bookingRoutes';
import { getAuthToken, testAdminId, testAgentId, errorHandler } from '../tests/setup';

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use(errorHandler);

describe('Notifications API', () => {
    let adminToken = '';
    let agentToken = '';

    beforeEach(() => {
        adminToken = getAuthToken('ADMIN');
        agentToken = getAuthToken('AGENT');
    });

    describe('GET /api/notifications', () => {
        it('Returns up to 20 notifications for current user', async () => {
            const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeLessThanOrEqual(20);
        });
        it('Assigning a booking creates a notification for the assigned agent', async () => {
            // Create a booking
            const bRes = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    contactPerson: 'AssignTest',
                    contactNumber: '+1234567890',
                    bookingType: 'B2C'
                });
            
            const bookingId = bRes.body._id || bRes.body.id;

            // Assign to agent
            await request(app)
                .patch(`/api/bookings/${bookingId}/assign`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ assignedToUserId: testAgentId });

            // Wait for background notification side effects to execute
            await new Promise(resolve => setImmediate(resolve));

            // Check agent notifications
            const nRes = await request(app).get('/api/notifications').set('Authorization', `Bearer ${agentToken}`);
            expect(nRes.status).toBe(200);
            expect(nRes.body.length).toBeGreaterThan(0);
            expect(nRes.body[0].message).toMatch(/has been assigned to you/i);
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        it('marks notification as read', async () => {
            const nRes = await request(app).get('/api/notifications').set('Authorization', `Bearer ${agentToken}`);
            if (nRes.body.length > 0) {
                const notifId = nRes.body[0]._id;
                const readRes = await request(app).put(`/api/notifications/${notifId}/read`).set('Authorization', `Bearer ${agentToken}`);
                expect(readRes.status).toBe(200);
                expect(readRes.body.isRead).toBe(true);
            }
        });
    });
});
