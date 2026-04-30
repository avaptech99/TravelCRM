const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'src/.env' }); // or wherever it is

async function test() {
    const token = jwt.sign(
        { id: '65f6c8d7e000000000000001', role: 'MARKETER', name: 'Tester', email: 'test@example.com' },
        process.env.JWT_SECRET || 'fallback-secret-for-dev',
        { expiresIn: '1h' }
    );
    
    try {
        // Just mock some request or try a real ID. Let's see if we can find a booking.
        console.log("Token:", token);
    } catch (e) { console.error(e); }
}
test();
