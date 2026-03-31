import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../../../components/ui/dialog';
import api from '../../../api/client';
import type { Booking } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface EditModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChangeToBooked: (booking: Booking) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ booking, isOpen, onClose, onStatusChangeToBooked }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [status, setStatus] = useState<string>('');
    const [assignedToUserId, setAssignedToUserId] = useState<string>('');
    const [interested, setInterested] = useState<'Yes' | 'No'>('No');
    const [commentText, setCommentText] = useState<string>('');

    // Reset state when booking changes
    React.useEffect(() => {
        if (booking) {
            setStatus(booking.status);
            setAssignedToUserId(booking.assignedToUserId || '');
            setInterested(booking.interested || 'No');
            setCommentText('');
        }
    }, [booking]);

    const canChangeAgent = true; // Both ADMIN and AGENT can change it now

    const [agents, setAgents] = useState<{ id: string, name: string }[]>([]);

    React.useEffect(() => {
        if (isOpen && canChangeAgent) {
            api.get('/users/agents').then(res => setAgents(res.data)).catch(console.error);
        }
    }, [isOpen, canChangeAgent]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!booking) return;
            const promises: Promise<any>[] = [];

            // 1. Update Status
            if (status !== booking.status) {
                promises.push(api.patch(`/bookings/${booking.id}/status`, { status }));
            }

            // 2. Update Assignee
            if (canChangeAgent && assignedToUserId !== (booking.assignedToUserId || '')) {
                promises.push(api.patch(`/bookings/${booking.id}/assign`, { assignedToUserId: assignedToUserId || null }));
            }

            // 3. Update Pricing/Other Details (Interested)
            if (interested !== (booking.interested || 'No')) {
                promises.push(api.put(`/bookings/${booking.id}`, { interested }));
            }

            // 4. Add Comment
            if (commentText.trim()) {
                promises.push(api.post(`/bookings/${booking.id}/comments`, { text: commentText }));
            }

            await Promise.all(promises);

            return { oldStatus: booking.status, newStatus: status };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            let message = 'Booking updated successfully!';
            if (commentText.trim()) message = 'Booking updated & comment added!';
            toast.success(message);

            onClose();

            // Trigger traveler page redirect if status changed to Booked AND no travelers exist yet
            if (data?.newStatus === 'Booked' && data?.oldStatus !== 'Booked' && booking && (!booking.travelers || booking.travelers.length === 0)) {
                navigate(`/bookings/${booking.id}/travelers`);
                onStatusChangeToBooked({ ...booking, status: 'Booked' }); // keep for any other side effects, but navigation happens
            }
        },
        onError: (err: any) => {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update booking.';
            toast.error(errorMessage);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!booking) return;
            if (window.confirm('Are you sure you want to delete this booking entirely? This action cannot be undone.')) {
                await api.delete(`/bookings/${booking.id}`);
                return true;
            }
            return false;
        },
        onSuccess: (deleted) => {
            if (deleted) {
                queryClient.invalidateQueries({ queryKey: ['bookings'] });
                toast.success('Booking deleted successfully');
                onClose();
            }
        },
        onError: () => {
            toast.error('Failed to delete booking.');
        }
    });

    const isDirty = (booking && status !== booking.status) ||
        (canChangeAgent && booking && assignedToUserId !== (booking.assignedToUserId || '')) ||
        (booking && interested !== (booking.interested || 'No')) ||
        commentText.trim().length > 0;

    if (!booking) return null;

    const { user } = useAuth();
    const isMarketer = user?.role === 'MARKETER';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Booking</DialogTitle>
                    <DialogDescription>
                        {isMarketer 
                            ? "Add remarks or updates for this lead."
                            : `Update status, assign an agent, and add remarks for ${booking.contactPerson}.`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Status Update */}
                    {!isMarketer && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Working">Working</option>
                                <option value="Sent">Sent To Customer</option>
                                <option value="Booked">Converted to EDT/Booked</option>
                            </select>
                        </div>
                    )}

                    {/* Agent Assignment */}
                    {canChangeAgent && !isMarketer && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Assigned Agent</label>
                            <select
                                value={assignedToUserId}
                                onChange={(e) => setAssignedToUserId(e.target.value)}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            >
                                <option value="" className="italic">-- Unassigned --</option>
                                {agents.filter(a => a.name !== 'Website Lead').map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Interested Selection */}
                    {!isMarketer && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Interested</label>
                            <select
                                value={interested}
                                onChange={(e) => setInterested(e.target.value as 'Yes' | 'No')}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    )}

                    {/* Add Comment */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Add Remark / Comment (Optional)</label>
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Type any new updates or requirements..."
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className={`sm:justify-between items-center ${isMarketer ? 'justify-end' : ''}`}>
                    {user?.role === 'ADMIN' && (
                        <button
                            type="button"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending || updateMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium rounded-lg text-sm px-4 py-2 transition-colors disabled:opacity-50"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Booking'}
                        </button>
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-600 bg-white hover:bg-slate-50 font-medium rounded-lg text-sm px-4 py-2 border border-slate-200 focus:ring-4 focus:outline-none focus:ring-slate-100"
                            disabled={updateMutation.isPending || deleteMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending || deleteMutation.isPending || !isDirty}
                            className="text-white bg-brand-gradient hover:opacity-90 disabled:opacity-50 font-bold rounded-lg text-sm px-5 py-2 focus:ring-4 focus:outline-none focus:ring-primary/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};
