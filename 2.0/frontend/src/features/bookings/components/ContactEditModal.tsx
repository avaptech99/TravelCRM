import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
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

interface ContactEditModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ContactEditModal: React.FC<ContactEditModalProps> = ({ booking, isOpen, onClose }) => {
    const queryClient = useQueryClient();

    const [contactPerson, setContactPerson] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [bookingType, setBookingType] = useState('');
    const [assignedGroup, setAssignedGroup] = useState('');

    const { data: dropdownSettings } = useQuery({
        queryKey: ['dropdown-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings/dropdowns');
            return data as Record<string, string[]>;
        },
    });

    useEffect(() => {
        if (booking) {
            setContactPerson(booking.contactPerson || '');
            setContactNumber(booking.contactNumber || '');
            setBookingType(booking.bookingType || 'B2C');
            setAssignedGroup(booking.assignedGroup || '');
        }
    }, [booking]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!booking) return;
            await api.put(`/bookings/${booking.id}`, {
                contactPerson,
                contactNumber,
                bookingType,
                assignedGroup: assignedGroup || null
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', booking?.id] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success('Contact information updated!');
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update contact info');
        }
    });

    if (!booking) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Edit Contact Info</DialogTitle>
                    <DialogDescription>
                        Update primary contact details and assignment group.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Contact Person</label>
                        <input
                            type="text"
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Contact Number</label>
                        <input
                            type="text"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Booking Type</label>
                            <select
                                value={bookingType}
                                onChange={(e) => setBookingType(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                            >
                                <option value="B2C">Direct (B2C)</option>
                                <option value="B2B">Agent (B2B)</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Assign to Group</label>
                            <select
                                value={assignedGroup}
                                onChange={(e) => setAssignedGroup(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                            >
                                <option value="">-- None --</option>
                                {dropdownSettings?.groups?.map((g: string) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending}
                        className="px-6 py-2 text-sm font-bold text-white bg-brand-gradient rounded-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
