const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Generate marketer token
const token = jwt.sign(
    { id: '65e23abc123...', role: 'MARKETER', name: 'Test Marketer', email: 'test@example.com' },
    JWT_SECRET,
    { expiresIn: '30d' }
);
console.log("Token:", token);
