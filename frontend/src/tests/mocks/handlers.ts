import { http, HttpResponse } from 'msw';

const MOCK_USER = {
    id: 'user1',
    name: 'Admin Test',
    email: 'admin@test.com',
    role: 'ADMIN',
    groups: ['Management'],
    permissions: {}
};

const MOCK_BOOKING = {
    id: 'booking1',
    _id: 'booking1',
    uniqueCode: 'TW1001',
    primaryContactId: { _id: 'pc1', contactName: 'John Doe', contactPhoneNo: '+123' },
    contact: { name: 'John Doe', phone: '+123', type: 'Agent (B2B)' },
    contactPerson: 'John Doe',
    contactNumber: '+123',
    status: 'Pending',
    totalAmount: 1000,
    outstanding: 1000,
    segments: [],
    assignedToUserId: null,
    createdByUserId: 'user1',
    createdAt: new Date().toISOString()
};

export const handlers = [
    http.post('*/api/auth/login', async ({ request }) => {
        const { email, password } = await request.json() as any;
        if (email === 'admin@test.com' && password === 'testpass123') {
            return HttpResponse.json({
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIiwibmFtZSI6IkFkbWluIFRlc3QiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6IkFETUlOIiwiZ3JvdXBzIjpbIk1hbmFnZW1lbnQiXX0.signature',
                user: MOCK_USER
            });
        }
        return HttpResponse.json(
            { message: 'Invalid credentials' }, 
            { status: 401 }
        );
    }),

    http.get('*/api/sync', () => {
        return HttpResponse.json({
            stats: { total: 10, pending: 5, working: 2, sent: 2, booked: 1 },
            recentBookings: [MOCK_BOOKING],
            notifications: []
        });
    }),

    http.get('*/api/bookings', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        
        if (search === 'NonExistent') {
            return HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
        }

        return HttpResponse.json({
            data: [MOCK_BOOKING, { ...MOCK_BOOKING, id: 'booking2', _id: 'booking2', uniqueCode: 'TW1002', status: 'Working' }],
            meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
        });
    }),

    http.get('*/api/bookings/:id', ({ params }) => {
        if (params.id === 'booking1') {
            return HttpResponse.json({ ...MOCK_BOOKING, bookingType: 'B2B' });
        }
        return new HttpResponse(null, { status: 404 });
    }),

    http.post('*/api/bookings', async () => {
        return HttpResponse.json({
            ...MOCK_BOOKING,
            id: 'newbooking',
            uniqueCode: 'TW9999'
        }, { status: 201 });
    }),

    http.patch('*/api/bookings/:id/status', async ({ request }) => {
        const { status } = await request.json() as any;
        return HttpResponse.json({
            ...MOCK_BOOKING,
            status
        });
    }),

    http.get('*/api/users/agents', () => {
        return HttpResponse.json([
            { id: 'agent1', _id: 'agent1', name: 'Agent 1', email: 'agent1@test.com', role: 'AGENT', groups: ['Sales'] }
        ]);
    }),

    http.get('*/api/settings/dropdowns', () => {
        return HttpResponse.json({
            groups: ['Package / LCC', 'Ticketing INT', 'Visa', 'Operation', 'Account']
        });
    }),

    http.get('*/api/notifications', () => {
        return HttpResponse.json([]);
    })
];
