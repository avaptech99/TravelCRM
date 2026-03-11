import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import type { Booking } from '../../../types';
import { toast } from 'sonner';

interface StatusUpdateModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChangeToBooked?: (booking: Booking) => void;
}

const STATUSES = ['Pending', 'Working', 'Sent', 'Booked'];

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({ booking, isOpen, onClose, onStatusChangeToBooked }) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (newStatus: string) => {
            await api.patch(`/bookings/${booking?.id}/status`, { status: newStatus });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success('Status updated successfully');
            onClose();

            if (variables === 'Booked' && booking) {
                onStatusChangeToBooked?.(booking);
            }
        },
        onError: (err: any) => {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update status';
            toast.error(errorMessage);
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Status for {booking?.contactPerson}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 pt-4">
                    {STATUSES.map((status) => (
                        <button
                            key={status}
                            onClick={() => mutation.mutate(status)}
                            disabled={mutation.isPending || booking?.status === status}
                            className={`w-full text-left px-4 py-3 rounded-md transition-colors border ${booking?.status === status
                                ? 'bg-slate-100 border-slate-200 text-slate-800 font-medium'
                                : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
                                }`}
                        >
                            {status} {booking?.status === status && '(Current)'}
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
