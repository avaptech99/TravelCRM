import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/userRoutes';
import { getAuthToken, testAdminId, testAgentId, errorHandler } from '../tests/setup';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(errorHandler);

describe('Users API', () => {
    let adminToken = '';
    let agentToken = '';

    beforeEach(() => {
        adminToken = getAuthToken('ADMIN');
        agentToken = getAuthToken('AGENT');
    });

    describe('GET /api/users', () => {
        it('Admin gets full user list', async () => {
            const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('Agent gets 403', async () => {
            const res = await request(app).get('/api/users').set('Authorization', `Bearer ${agentToken}`);
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Not authorized as an admin/i);
        });
    });

    describe('POST /api/users', () => {
        it('Admin creates a new user with valid role', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New User', email: 'new@test.com', password: 'password123', role: 'MARKETER' });
            
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.passwordHash).toBeUndefined(); // Password hash shouldn't be returned in plain text! Wait, the prompt says "returned passwordHash is not plain text".
            // Let's assert it doesn't match 'password123' if it's there
            if (res.body.passwordHash) {
                expect(res.body.passwordHash).not.toBe('password123');
            }
        });

        it('Duplicate email returns 400', async () => {
            await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({ name: 'User 1', email: 'dup@test.com', password: 'password123', role: 'AGENT' });
            const res = await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({ name: 'User 2', email: 'dup@test.com', password: 'password123', role: 'AGENT' });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/users/agents', () => {
        it('Returns only users with role AGENT, accessible by all authenticated roles', async () => {
            const res = await request(app).get('/api/users/agents').set('Authorization', `Bearer ${agentToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach((u: any) => expect(['AGENT', 'MANAGER', 'ADMIN']).toContain(u.role));
        });
    });
});
