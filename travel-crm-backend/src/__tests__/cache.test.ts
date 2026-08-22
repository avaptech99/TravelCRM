import request from 'supertest';
import express from 'express';
import bookingRoutes from '../routes/bookingRoutes';
import { getAuthToken, errorHandler } from '../tests/setup';

const app = WebExpress();
function WebExpress() { return express(); }
app.use(express.json());
app.use('/api/bookings', bookingRoutes);
app.use(errorHandler);

describe('Cache Behavior', () => {
    let adminToken = '';

    beforeEach(() => {
        adminToken = getAuthToken('ADMIN');
    });

    it('First call to /api/bookings/stats returns X-Cache-Status: MISS', async () => {
        const res = await request(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['x-cache-status']).toBe('MISS');
    });

    it('Second call to /api/bookings/stats returns X-Cache-Status: HIT', async () => {
        await request(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`);
        const res = await request(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['x-cache-status']).toBe('HIT');
    });

    it('After creating a new booking, next stats call returns MISS (cache was invalidated)', async () => {
        await request(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`); // Cache it
        
        await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                contactPerson: 'Cache Test',
                contactNumber: '+1234567890',
                bookingType: 'B2C',
                segments: []
            });

        const res = await request(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['x-cache-status']).toBe('MISS');
    });
});
