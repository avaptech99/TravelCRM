const axios = require('axios');

const testWebhook = async () => {
    const url = 'http://localhost:5000/api/webhook/missed-call';
    
    // Test Case 1: New Lead (Unknown Number)
    console.log('--- Testing New Lead (Unknown Number) ---');
    try {
        const res1 = await axios.post(url, {
            number: '9876543210' + Math.floor(Math.random() * 1000),
            name: 'Test MacroDroid',
            type: 'Missed Call',
            receivedAt: new Date().toLocaleString()
        });
        console.log('Response:', res1.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }

    // Test Case 2: Existing Lead (if possible, but let's test a known number or search for one)
    // For now, let's just test that the endpoint responds.
};

testWebhook();
