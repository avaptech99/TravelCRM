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
        onMutate: async (newStatus) => {
            // Close the modal immediately — the user sees the change instantly
            onClose();

            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['bookings'] });
            // Snapshot all bookings queries for rollback
            const previousQueries = queryClient.getQueriesData({ queryKey: ['bookings'] });

            // Optimistically update any bookings query cache that contains this booking
            queryClient.setQueriesData({ queryKey: ['bookings'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((b: any) =>
                        b.id === booking?.id ? { ...b, status: newStatus } : b
                    ),
                };
            });

            return { previousQueries };
        },
        onSuccess: (_, variables) => {
            toast.success('Status updated successfully');
            if (variables === 'Booked' && booking) {
                onStatusChangeToBooked?.(booking);
            }
        },
        onError: (err: any, _variables, context) => {
            // Roll back all bookings queries
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, data]: any) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update status';
            toast.error(errorMessage);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
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
                                : 'bg-white border-slate-200 hover:border-primary/50 hover:bg-primary/5'
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
