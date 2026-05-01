import axios from 'axios';

async function testApi() {
    try {
        // 1. Log in to get token
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@travel.com',
            password: 'admin123'
        });
        
        const token = loginRes.data.token;
        console.log('Logged in, got token');

        // 2. Create Booking
        console.log('Creating booking...');
        const payload = {
            contactPerson: 'Anmoldeep Singh',
            contactNumber: '+919779344972',
            bookingType: 'B2C',
            requirements: 'xrdctfyvgbhj',
            assignedGroup: 'Default (Package / LCC)'
        };

        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        const createRes = await axios.post('http://localhost:5000/api/bookings', payload, config);
        console.log('Success!', createRes.data);

    } catch (e: any) {
        if (e.response) {
            console.error('API Error:', e.response.status, e.response.data);
        } else {
            console.error('Network Error:', e.message);
        }
    }
}

testApi();
