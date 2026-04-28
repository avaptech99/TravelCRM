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
    const [companyName, setCompanyName] = useState<string>('');
    const [assignedGroup, setAssignedGroup] = useState<string>('');
    const [estimatedCosts, setEstimatedCosts] = useState<any[]>([]);
    const [actualCosts, setActualCosts] = useState<any[]>([]);

    const { user } = useAuth();
    const isMarketer = user?.role === 'MARKETER';
    const canEditActualCost = user?.permissions?.canEditActualCost || user?.role === 'ADMIN';

    // Reset state when booking changes
    React.useEffect(() => {
        if (booking) {
            setStatus(booking.status);
            setAssignedToUserId(booking.assignedToUserId || '');
            setInterested(booking.interested || 'No');
            setCommentText('');
            setCompanyName(booking.companyName || '');
            setAssignedGroup(booking.assignedGroup || '');
            setEstimatedCosts(booking.estimatedCosts || []);
            setActualCosts(booking.actualCosts || []);
        }
    }, [booking]);

    const canChangeAgent = user?.role === 'ADMIN' || user?.permissions?.canAssignLeads; 

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

            // 3. Update Pricing/Other Details
            const putPayload: any = {};
            if (interested !== (booking.interested || 'No')) putPayload.interested = interested;
            if (companyName !== (booking.companyName || '')) putPayload.companyName = companyName;
            if (assignedGroup !== (booking.assignedGroup || '')) putPayload.assignedGroup = assignedGroup;
            
            // Always include costs to handle additions/removals
            putPayload.estimatedCosts = estimatedCosts;
            if (canEditActualCost) {
                putPayload.actualCosts = actualCosts;
            }

            if (Object.keys(putPayload).length > 0) {
                promises.push(api.put(`/bookings/${booking.id}`, putPayload));
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

                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Status Update */}
                    {!isMarketer && (
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>
                    )}

                    {/* Agent Assignment & Group */}
                    {!isMarketer && (
                        <div className="grid grid-cols-2 gap-4">
                            {canChangeAgent && (
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
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">Assigned Group</label>
                                <select
                                    value={assignedGroup}
                                    onChange={(e) => setAssignedGroup(e.target.value)}
                                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                >
                                    <option value="">-- None --</option>
                                    <option value="Visa">Visa Team</option>
                                    <option value="Ticketing">Ticketing Team</option>
                                    <option value="Operations">Operations Team</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Company Dropdown */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Company Name (If B2B)</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter Company Name"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        />
                    </div>

                    {/* Cost Sections */}
                    {!isMarketer && (
                        <div className="space-y-4 border-t border-slate-200 pt-4 mt-2">
                            {/* Estimated Costs */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-slate-800">Estimated Costs</h4>
                                    <button
                                        type="button"
                                        onClick={() => setEstimatedCosts([...estimatedCosts, { costType: '', price: 0, source: '' }])}
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        + Add Cost
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {estimatedCosts.map((cost, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Type (e.g. Flight)"
                                                value={cost.costType}
                                                onChange={(e) => {
                                                    const newCosts = [...estimatedCosts];
                                                    newCosts[idx].costType = e.target.value;
                                                    setEstimatedCosts(newCosts);
                                                }}
                                                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 w-1/3"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={cost.price}
                                                onChange={(e) => {
                                                    const newCosts = [...estimatedCosts];
                                                    newCosts[idx].price = Number(e.target.value);
                                                    setEstimatedCosts(newCosts);
                                                }}
                                                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 w-1/3"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Source/Vendor"
                                                value={cost.source}
                                                onChange={(e) => {
                                                    const newCosts = [...estimatedCosts];
                                                    newCosts[idx].source = e.target.value;
                                                    setEstimatedCosts(newCosts);
                                                }}
                                                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 w-1/3"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEstimatedCosts(estimatedCosts.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700 font-bold"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actual Costs (Guarded) */}
                            {canEditActualCost && (
                                <div>
                                    <div className="flex justify-between items-center mb-2 mt-4">
                                        <h4 className="text-sm font-bold text-slate-800">Actual Costs</h4>
                                        <button
                                            type="button"
                                            onClick={() => setActualCosts([...actualCosts, { costType: '', price: 0, source: '' }])}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            + Add Actual Cost
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {actualCosts.map((cost, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Type (e.g. Flight)"
                                                    value={cost.costType}
                                                    onChange={(e) => {
                                                        const newCosts = [...actualCosts];
                                                        newCosts[idx].costType = e.target.value;
                                                        setActualCosts(newCosts);
                                                    }}
                                                    className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 w-1/3 border-emerald-200"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={cost.price}
                                                    onChange={(e) => {
                                                        const newCosts = [...actualCosts];
                                                        newCosts[idx].price = Number(e.target.value);
                                                        setActualCosts(newCosts);
                                                    }}
                                                    className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 w-1/3 border-emerald-200"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Source/Vendor"
                                                    value={cost.source}
                                                    onChange={(e) => {
                                                        const newCosts = [...actualCosts];
                                                        newCosts[idx].source = e.target.value;
                                                        setActualCosts(newCosts);
                                                    }}
                                                    className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 w-1/3 border-emerald-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setActualCosts(actualCosts.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-700 font-bold"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Comment */}
                    <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 mt-2">
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
