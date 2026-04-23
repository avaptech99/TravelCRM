import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../../api/client';
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

interface BulkAssignAgentModalProps {
    bookingIds: string[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const BulkAssignAgentModal: React.FC<BulkAssignAgentModalProps> = ({ bookingIds, isOpen, onClose, onSuccess }) => {
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
            assignedToUserId: '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            await api.post(`/bookings/bulk-assign`, {
                bookingIds,
                assignedToUserId: data.assignedToUserId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success(`Successfully assigned ${bookingIds.length} leads`);
            onSuccess();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reassign agents');
        },
    });

    const onSubmit = (data: FormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Bulk Assign Agents</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Select Agent for {bookingIds.length} leads</label>
                        {isAgentsLoading ? (
                            <div className="py-2 text-sm text-slate-500">Loading agents...</div>
                        ) : (
                            <select
                                {...register('assignedToUserId')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="" disabled>Select an agent...</option>
                                {agents?.filter((a: any) => a.name !== 'Website Lead').map((agent: any) => (
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
                            {mutation.isPending ? 'Assigning...' : 'Assign All'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
