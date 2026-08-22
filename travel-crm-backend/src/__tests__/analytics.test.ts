import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../routes/analyticsRoutes';
import { getAuthToken, errorHandler } from '../tests/setup';

const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);
app.use(errorHandler);

describe('Analytics API', () => {
    let adminToken = '';
    let agentToken = '';
    let marketerToken = '';

    beforeEach(() => {
        adminToken = getAuthToken('ADMIN');
        agentToken = getAuthToken('AGENT');
        marketerToken = getAuthToken('MARKETER');
    });

    describe('Role Access', () => {
        it('All analytics routes return 200 for Admin', async () => {
            const res = await request(app).get('/api/analytics/payments').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('All analytics routes return 403 for Agent and Marketer', async () => {
            const res1 = await request(app).get('/api/analytics/payments').set('Authorization', `Bearer ${agentToken}`);
            expect(res1.status).toBe(403);
            
            const res2 = await request(app).get('/api/analytics/agents').set('Authorization', `Bearer ${marketerToken}`);
            expect(res2.status).toBe(403);
        });
    });

    describe('GET /api/analytics/payments', () => {
        it('Returns { totalCollected, totalExpected, totalBalance }', async () => {
            const res = await request(app).get('/api/analytics/payments').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalCollected');
            expect(res.body).toHaveProperty('totalExpected');
            expect(res.body).toHaveProperty('balance');
            expect(typeof res.body.totalCollected).toBe('number');
        });
    });

    describe('GET /api/analytics/agents', () => {
        it('Returns per-agent stats with conversionRate as a number', async () => {
            const res = await request(app).get('/api/analytics/agents').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            if (res.body.length > 0) {
                expect(typeof res.body[0].conversionRate).toBe('number');
            }
        });
    });
});
