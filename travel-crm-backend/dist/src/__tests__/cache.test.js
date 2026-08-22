"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const bookingRoutes_1 = __importDefault(require("../routes/bookingRoutes"));
const setup_1 = require("../tests/setup");
const app = WebExpress();
function WebExpress() { return (0, express_1.default)(); }
app.use(express_1.default.json());
app.use('/api/bookings', bookingRoutes_1.default);
app.use(setup_1.errorHandler);
describe('Cache Behavior', () => {
    let adminToken = '';
    beforeEach(() => {
        adminToken = (0, setup_1.getAuthToken)('ADMIN');
    });
    it('First call to /api/bookings/stats returns X-Cache-Status: MISS', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['x-cache-status']).toBe('MISS');
    });
    it('Second call to /api/bookings/stats returns X-Cache-Status: HIT', async () => {
        await (0, supertest_1.default)(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`);
        const res = await (0, supertest_1.default)(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['x-cache-status']).toBe('HIT');
    });
    it('After creating a new booking, next stats call returns MISS (cache was invalidated)', async () => {
        await (0, supertest_1.default)(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`); // Cache it
        await (0, supertest_1.default)(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            contactPerson: 'Cache Test',
            contactNumber: '+1234567890',
            bookingType: 'B2C',
            segments: []
        });
        const res = await (0, supertest_1.default)(app).get('/api/bookings/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['x-cache-status']).toBe('MISS');
    });
});
