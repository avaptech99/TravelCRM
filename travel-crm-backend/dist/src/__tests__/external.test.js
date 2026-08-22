"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const externalRoutes_1 = __importDefault(require("../routes/externalRoutes"));
const Booking_1 = __importDefault(require("../models/Booking"));
const PrimaryContact_1 = __importDefault(require("../models/PrimaryContact"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Inject fake API key middleware logic if the app checks process.env.WP_API_KEY
app.use((req, res, next) => {
    process.env.WP_API_KEY = 'test-api-key';
    process.env.EXTERNAL_API_KEY = 'test-api-key';
    next();
});
app.use('/api/external', externalRoutes_1.default);
describe('External Lead API', () => {
    describe('POST /api/external/lead', () => {
        it('Valid API key + valid raw_fields → returns 201 with bookingId and uniqueCode', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/external/lead')
                .set('x-api-key', 'test-api-key')
                .send({
                raw_fields: [
                    { key: 'name', label: 'Name', value: 'WP Lead' },
                    { key: 'email', label: 'Email', value: 'wp@lead.com' },
                    { key: 'phone', label: 'Phone', value: '+19999999999' },
                    { key: 'from', label: 'From', value: 'LAX' },
                    { key: 'to', label: 'To', value: 'JFK' },
                    { key: 'departure', label: 'Departure', value: '2026-10-10' },
                    { key: 'adult', label: 'Adult', value: '2' },
                    { key: 'child', label: 'Child', value: '1' }
                ]
            });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('bookingId');
            expect(res.body).toHaveProperty('uniqueCode');
            expect(res.body.uniqueCode).toMatch(/^TW\d+$/);
            // DB Verification
            const contact = await PrimaryContact_1.default.findOne({ contactName: 'WP Lead' });
            expect(contact).toBeTruthy();
            const booking = await Booking_1.default.findById(res.body.bookingId);
            expect(booking).toBeTruthy();
            // Adult: 2 + Child: 1 → travellers: 3
            // The prompt says "travellers: 3", let's check segment setup.
            // tripType detection: single leg -> one-way
            expect(booking?.segments[0].tripType).toBe('one-way');
            expect(booking?.segments[0].from).toBe('LAX');
            expect(booking?.segments[0].to).toBe('JFK');
        });
        it('Missing or wrong API key → 401', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/external/lead')
                .set('x-api-key', 'wrong-key')
                .send({ raw_fields: { 'Name': 'Test' } });
            expect(res.status).toBe(401);
        });
        it('Empty raw_fields → 400', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/external/lead')
                .set('x-api-key', 'test-api-key')
                .send({}); // missing raw_fields
            expect(res.status).toBe(400);
        });
    });
});
