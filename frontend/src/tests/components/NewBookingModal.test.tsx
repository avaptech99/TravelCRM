import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewBookingModal } from '../../features/bookings/components/NewBookingModal';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const TestParentWrapper = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <>
            <button onClick={() => setIsOpen(true)}>New Booking</button>
            <NewBookingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

const renderModal = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <TestParentWrapper />
            <Toaster />
        </QueryClientProvider>
    );
};

describe('NewBookingModal', () => {
    it('Modal opens when "New Booking" button is clicked', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByRole('button', { name: /new booking/i }));
        expect(screen.getByText(/Create New Booking/i)).toBeInTheDocument();
    });

    it('Shows Zod validation errors for missing required fields', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByRole('button', { name: /new booking/i }));
        
        // Wait for modal to open fully
        await screen.findByText(/Create New Booking/i);

        // Submit empty form (or default values)
        await user.click(screen.getByRole('button', { name: /Create Booking/i }));

        expect(await screen.findByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/Phone number must be exactly 10 digits/i)).toBeInTheDocument();
        expect(screen.getByText(/Requirements are compulsory/i)).toBeInTheDocument();
    });

    it('Submits correctly with valid data and calls the API', async () => {
        const user = userEvent.setup();
        renderModal();
        
        await user.click(screen.getByRole('button', { name: /new booking/i }));
        await screen.findByText(/Create New Booking/i);

        // Type valid values
        await user.type(screen.getByLabelText(/Contact Person/i), 'Test Name');
        await user.type(screen.getByLabelText(/Contact Number/i), '1234567890');
        await user.type(screen.getByLabelText(/Requirements/i), 'Need a flight to New York');

        await user.click(screen.getByRole('button', { name: /Create Booking/i }));

        // MSW mock returns 201 with TW9999
        await waitFor(() => {
            // Check for toast notifications or modal closing
            expect(screen.queryByText(/Create New Booking/i)).not.toBeInTheDocument();
        });
    });
});
