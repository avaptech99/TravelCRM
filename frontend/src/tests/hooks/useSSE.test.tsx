import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSSE } from '../../hooks/useSSE';
import { vi } from 'vitest';

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('useSSE Hook', () => {
    let mockEventSource: any;

    beforeEach(() => {
        mockEventSource = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            close: vi.fn(),
        };
        global.EventSource = vi.fn().mockImplementation(function() {
            return mockEventSource;
        }) as any;
    });

    it('Connects to /api/stream?token=... on mount', () => {
        localStorage.setItem('token', 'test-token');
        renderHook(() => useSSE('test-token'), { wrapper });

        expect(global.EventSource).toHaveBeenCalledWith(expect.stringContaining('/api/stream?token=test-token'));
    });

    it('booking_created event triggers React Query invalidation for ["bookings"]', () => {
        const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
        renderHook(() => useSSE('test-token'), { wrapper });

        // Simulate booking_created event
        const onBookingCreated = mockEventSource.addEventListener.mock.calls.find((call: any) => call[0] === 'booking_created')[1];
        onBookingCreated({ data: JSON.stringify({ id: '1' }) });

        expect(invalidateQueriesSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['bookings'] }));
    });

    it('Cleans up EventSource on unmount (no memory leaks)', () => {
        const { unmount } = renderHook(() => useSSE('test-token'), { wrapper });
        unmount();
        expect(mockEventSource.close).toHaveBeenCalled();
    });
});
