import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import { Bookings } from '../../pages/Bookings';

const renderBookings = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <Bookings />
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('Bookings Page', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIiwibmFtZSI6IkFkbWluIFRlc3QiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6IkFETUlOIiwiZ3JvdXBzIjpbIk1hbmFnZW1lbnQiXX0.signature'); // Put a token so AuthProvider thinks we are authenticated
    });

    it('Renders the bookings table with column headers', async () => {
        renderBookings();
        await waitFor(() => {
            expect(screen.getAllByText('TW1001')[0]).toBeInTheDocument();
        });
        expect(screen.getByText(/Contact Person/i)).toBeInTheDocument();
        expect(screen.getByText(/Status/i)).toBeInTheDocument();
    });

    it('Displays booking rows with uniqueCode, contactPerson, status', async () => {
        renderBookings();
        await waitFor(() => {
            expect(screen.getAllByText('TW1001')[0]).toBeInTheDocument();
        });
        expect(screen.getAllByText('John Doe')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Pending')[0]).toBeInTheDocument();
    });

    it('Shows empty state message when no bookings match filters', async () => {
        const user = userEvent.setup();
        renderBookings();
        
        const searchInput = await screen.findByPlaceholderText(/Search contact person/i);
        await user.type(searchInput, 'NonExistent');

        // Based on our MSW mock, this returns empty
        const emptyStates = await screen.findAllByText(/No bookings found/i);
        expect(emptyStates[0]).toBeInTheDocument();
    });
});
