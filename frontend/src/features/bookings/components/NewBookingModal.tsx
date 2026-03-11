import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';

import { countryCodes } from '../../../utils/countryCodes';

const bookingSchema = z.object({
    contactPerson: z.string().min(2, 'Name must be at least 2 characters'),
    countryCode: z.string(),
    contactNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    requirements: z.string().min(1, 'Requirements are compulsory'),
    bookingType: z.enum(['B2B', 'B2C']),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface NewBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            contactPerson: '',
            countryCode: '+91',
            contactNumber: '',
            requirements: '',
            bookingType: 'B2C',
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: BookingFormValues) => {
            const combinedData = {
                ...data,
                contactNumber: `${data.countryCode}${data.contactNumber}`,
            };
            const response = await api.post('/bookings', combinedData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['recent-bookings'] });
            toast.success('New booking created successfully!');
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to create booking');
        },
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    const onSubmit = (data: BookingFormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Booking</DialogTitle>
                    <p className="text-sm text-slate-500">
                        Enter the prospect's contact details and requirements below.
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Booking Type <span className="text-red-500">*</span></label>
                        <div className="flex gap-4">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    value="B2B"
                                    {...register('bookingType')}
                                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm font-medium text-slate-700">Agent (B2B)</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    value="B2C"
                                    {...register('bookingType')}
                                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm font-medium text-slate-700">Direct (B2C)</span>
                            </label>
                        </div>
                        {errors.bookingType && (
                            <p className="text-red-500 text-xs mt-1">{errors.bookingType.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="contactPerson" className="text-sm font-medium text-slate-700">
                            Contact Person <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="contactPerson"
                            type="text"
                            {...register('contactPerson')}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Customer or Sub Agent Name"
                        />
                        {errors.contactPerson && (
                            <p className="text-red-500 text-xs mt-1">{errors.contactPerson.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="contactNumber" className="text-sm font-medium text-slate-700">
                            Contact Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <select
                                {...register('countryCode')}
                                className="w-[100px] px-2 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                {countryCodes.map((cc) => (
                                    <option key={cc.code} value={cc.code}>
                                        {cc.code} ({cc.name})
                                    </option>
                                ))}
                            </select>
                            <input
                                id="contactNumber"
                                type="text"
                                {...register('contactNumber')}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="9876543210"
                            />
                        </div>
                        {errors.contactNumber && (
                            <p className="text-red-500 text-xs mt-1">{errors.contactNumber.message}</p>
                        )}
                        {errors.countryCode && (
                            <p className="text-red-500 text-xs mt-1">{errors.countryCode.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="requirements" className="text-sm font-medium text-slate-700">
                            Requirements <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="requirements"
                            {...register('requirements')}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            placeholder="Detailed travel requirements..."
                        />
                        {errors.requirements && (
                            <p className="text-red-500 text-xs mt-1">{errors.requirements.message}</p>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                            disabled={mutation.isPending || isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending || isSubmitting}
                            className="px-4 py-2 bg-indigo-600 border border-transparent text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {mutation.isPending ? 'Creating...' : 'Create Booking'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
