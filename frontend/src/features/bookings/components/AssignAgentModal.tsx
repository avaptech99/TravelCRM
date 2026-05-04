import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../../api/client';
import type { Booking } from '../../../types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';

const assignSchema = z.object({
    assignedToUserId: z.string().uuid('Please select a valid agent'),
});

type FormValues = z.infer<typeof assignSchema>;

interface AssignAgentModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
}

export const AssignAgentModal: React.FC<AssignAgentModalProps> = ({ booking, isOpen, onClose }) => {
    const queryClient = useQueryClient();

    const { data: agents, isLoading: isAgentsLoading } = useQuery({
        queryKey: ['agents'],
        queryFn: async () => {
            const { data } = await api.get('/users/agents');
            return data;
        },
        enabled: isOpen,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            assignedToUserId: booking?.assignedToUserId || '',
        },
    });

    // Reset default value when booking changes
    React.useEffect(() => {
        if (isOpen && booking) {
            register('assignedToUserId').onChange({ target: { value: booking.assignedToUserId || '' } });
        }
    }, [booking, isOpen, register]);

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            await api.patch(`/bookings/${booking?.id}/assign`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success('Agent reassigned successfully');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reassign agent');
        },
    });

    const onSubmit = (data: FormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Agent</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Select Agent</label>
                        {isAgentsLoading ? (
                            <div className="py-2 text-sm text-slate-500">Loading agents...</div>
                        ) : (
                            <select
                                {...register('assignedToUserId')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="" disabled>Select an agent...</option>
                                {agents?.filter((a: any) => {
                                    const matchesName = a.name !== 'Website Lead';
                                    if (!booking?.assignedGroup) return matchesName;
                                    const matchesGroup = a.groups?.some((g: string) => g.toLowerCase().trim() === booking.assignedGroup?.toLowerCase().trim());
                                    return matchesName && matchesGroup;
                                }).map((agent: any) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.name} ({agent.email})
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.assignedToUserId && (
                            <p className="text-red-500 text-xs mt-1">{errors.assignedToUserId.message}</p>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="px-4 py-2 bg-brand-gradient border border-transparent text-white rounded-md hover:opacity-90 shadow-sm transition-all font-bold disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {mutation.isPending ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
