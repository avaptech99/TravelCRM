"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("../routes/authRoutes"));
const setup_1 = require("../tests/setup");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use(setup_1.errorHandler);
describe('Auth API', () => {
    it('POST /api/auth/login - Returns 200 + JWT token with valid credentials', async () => {
        const response = await (0, supertest_1.default)(app)
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
        const response = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'wrongpassword' });
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Invalid email or password/i);
    });
    it('POST /api/auth/login - Returns 401 with non-existent email', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@test.com', password: 'testpass123' });
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Invalid email or password/i);
    });
    it('POST /api/auth/login - Returns 400 if email or password field is missing', async () => {
        let response = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com' });
        expect(response.status).toBe(400);
        response = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({ password: 'testpass123' });
        expect(response.status).toBe(400);
    });
});
