const axios = require('axios');

async function testExternalLead() {
    try {
        const response = await axios.post('http://localhost:5000/api/external/lead', {
            contactPerson: "WP Test Business",
            contactNumber: "9876543210",
            contactEmail: "wp-test@example.com",
            flightFrom: "Dubai",
            flightTo: "London",
            travelDate: "2026-05-20",
            tripType: "round-trip",
            adults: 2,
            children: 1,
            infants: 0,
            class: "Economy",
            requirements: "Window seat preferred"
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': 'crm-wp-integration-2026'
            }
        });

        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testExternalLead();
