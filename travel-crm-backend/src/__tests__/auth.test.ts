import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';
import { getAuthToken, errorHandler } from '../tests/setup';
import User from '../models/User';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth API', () => {
    it('POST /api/auth/login - Returns 200 + JWT token with valid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'testpass123' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email', 'admin@test.com');
        expect(response.body).toHaveProperty('role', 'ADMIN');
        expect(response.body).toHaveProperty('name', 'Admin User');
    });

    it('POST /api/auth/login - Returns 401 with wrong password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'wrongpassword' });

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Invalid email or password/i);
    });

    it('POST /api/auth/login - Returns 401 with non-existent email', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@test.com', password: 'testpass123' });

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Invalid email or password/i);
    });

    it('POST /api/auth/login - Returns 400 if email or password field is missing', async () => {
        let response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com' });

        expect(response.status).toBe(400);

        response = await request(app)
            .post('/api/auth/login')
            .send({ password: 'testpass123' });

        expect(response.status).toBe(400);
    });
});
