import request from 'supertest';
import express from 'express';
import syncRoutes from '../routes/syncRoutes';
import { getAuthToken, errorHandler } from '../tests/setup';

const app = express();
app.use(express.json());
app.use('/api/sync', syncRoutes);
app.use(errorHandler);

describe('Sync API', () => {
    let adminToken = '';
    let agentToken = '';

    beforeEach(() => {
        adminToken = getAuthToken('ADMIN');
        agentToken = getAuthToken('AGENT');
    });

    describe('GET /api/sync', () => {
        it('Returns { stats, recentBookings, notifications } shape', async () => {
            const res = await request(app).get('/api/sync').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('stats');
            expect(res.body).toHaveProperty('recentBookings');
            expect(res.body).toHaveProperty('notifications');
            
            expect(Array.isArray(res.body.recentBookings)).toBe(true);
            expect(Array.isArray(res.body.notifications)).toBe(true);
        });

        it('Returns 401 without token', async () => {
            const res = await request(app).get('/api/sync');
            expect(res.status).toBe(401);
        });
    });
});
