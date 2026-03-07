import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import type { Booking } from '../../../types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Plane } from 'lucide-react';

const travelerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phoneNumber: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    country: z.string().optional(),
    flightFrom: z.string().optional(),
    flightTo: z.string().optional(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    tripType: z.enum(['one-way', 'round-trip']).optional(),
    returnDate: z.string().optional(),
    returnDepartureTime: z.string().optional(),
    returnArrivalTime: z.string().optional(),
    dob: z.string().optional(),
    anniversary: z.string().optional(),
}).superRefine(() => {
    // If it's a secondary traveler (we check outside the schema during render, but we can enforce phone here loosely)
    // We will handle the "compulsory" phone number validation at the form array level if needed, or just require it in the UI.
    // Let's enforce it strictly in the UI.
});

const formSchema = z.object({
    travelers: z.array(travelerSchema).min(1, 'At least one traveler is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface TravelerModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TravelerModal: React.FC<TravelerModalProps> = ({ booking, isOpen, onClose }) => {
    const queryClient = useQueryClient();

    const emptyTraveler = {
        name: '',
        phoneNumber: '',
        email: '',
        country: '',
        flightFrom: '',
        flightTo: '',
        departureTime: '',
        arrivalTime: '',
        tripType: 'one-way' as const,
        returnDate: '',
        returnDepartureTime: '',
        returnArrivalTime: '',
        dob: '',
        anniversary: ''
    };

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            travelers: [emptyTraveler],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'travelers',
    });

    // Reset form when booking changes or modal opens — pre-fill with existing data
    React.useEffect(() => {
        if (isOpen && booking) {
            if (booking.travelers && booking.travelers.length > 0) {
                reset({
                    travelers: booking.travelers.map(t => ({
                        name: t.name || '',
                        phoneNumber: t.phoneNumber || '',
                        email: t.email || '',
                        country: t.country || '',
                        flightFrom: t.flightFrom || '',
                        flightTo: t.flightTo || '',
                        departureTime: t.departureTime || '',
                        arrivalTime: t.arrivalTime || '',
                        tripType: (t.tripType as 'one-way' | 'round-trip') || 'one-way',
                        returnDate: t.returnDate || '',
                        returnDepartureTime: t.returnDepartureTime || '',
                        returnArrivalTime: t.returnArrivalTime || '',
                        dob: t.dob || '',
                        anniversary: t.anniversary || '',
                    })),
                });
            } else {
                reset({
                    travelers: [emptyTraveler],
                });
            }
        }
    }, [isOpen, booking, reset]);

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const hasExisting = booking?.travelers && booking.travelers.length > 0;
            if (hasExisting) {
                // Update (replace) existing travelers
                await api.put(`/bookings/${booking?.id}/travelers`, data.travelers);
            } else {
                // Add new travelers
                await api.post(`/bookings/${booking?.id}/travelers`, data.travelers);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['booking', booking?.id] });
            toast.success('Travelers saved successfully');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to save travelers');
        },
    });

    const onSubmit = (data: FormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Traveler Details</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium text-slate-800">Traveler {index + 1}</h4>
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                                    <input
                                        {...register(`travelers.${index}.name` as const)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="John Doe"
                                    />
                                    {errors.travelers?.[index]?.name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.travelers[index]?.name?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Phone Number {index > 0 ? '*' : ''}
                                    </label>
                                    <input
                                        {...register(`travelers.${index}.phoneNumber` as const, { required: index > 0 ? "Phone is required for additional members" : false })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="+1 234 567 890"
                                    />
                                    {errors.travelers?.[index]?.phoneNumber && (
                                        <p className="text-red-500 text-xs mt-1">{errors.travelers[index]?.phoneNumber?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        {...register(`travelers.${index}.email` as const)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="john@example.com"
                                    />
                                    {errors.travelers?.[index]?.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.travelers[index]?.email?.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                            <Calendar size={12} className="text-slate-400" /> Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            max={new Date().toISOString().split('T')[0]}
                                            {...register(`travelers.${index}.dob` as const)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white cursor-pointer hover:border-indigo-300 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                            <Calendar size={12} className="text-slate-400" /> Anniversary
                                        </label>
                                        <input
                                            type="date"
                                            max={new Date().toISOString().split('T')[0]}
                                            {...register(`travelers.${index}.anniversary` as const)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white cursor-pointer hover:border-indigo-300 transition-colors"
                                        />
                                    </div>
                                </div>

                                {index === 0 && (
                                    <>
                                        <div className="md:col-span-2 mt-2 pt-4 border-t border-slate-200">
                                            <h5 className="text-sm font-semibold text-slate-800 mb-3 block">Primary Traveler Flight Details</h5>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Country / Destination</label>
                                                    <input
                                                        {...register(`travelers.${index}.country` as const)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                        placeholder="e.g. France"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">Flight From</label>
                                                        <input
                                                            {...register(`travelers.${index}.flightFrom` as const)}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
                                                            placeholder="JFK"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">Flight To</label>
                                                        <input
                                                            {...register(`travelers.${index}.flightTo` as const)}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
                                                            placeholder="LHR"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                            <Plane size={12} className="text-indigo-400" /> Departure
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            min={new Date().toISOString().slice(0, 16)}
                                                            {...register(`travelers.${index}.departureTime` as const)}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white cursor-pointer hover:border-indigo-300 transition-colors"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                            <Plane size={12} className="text-green-400 rotate-90" /> Arrival
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            min={new Date().toISOString().slice(0, 16)}
                                                            {...register(`travelers.${index}.arrivalTime` as const)}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white cursor-pointer hover:border-indigo-300 transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">Trip Type</label>
                                                        <select
                                                            {...register(`travelers.${index}.tripType` as const)}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                                        >
                                                            <option value="one-way">One Way</option>
                                                            <option value="round-trip">Round Trip</option>
                                                        </select>
                                                    </div>
                                                    {watch(`travelers.${index}.tripType`) === 'round-trip' && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Return Date</label>
                                                            <input
                                                                type="date"
                                                                min={new Date().toISOString().split('T')[0]}
                                                                {...register(`travelers.${index}.returnDate` as const)}
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {watch(`travelers.${index}.tripType`) === 'round-trip' && (
                                                    <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                                                        <div className="col-span-2">
                                                            <p className="text-xs font-semibold text-amber-800 mb-2">Return Flight</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                                <Plane size={12} className="text-amber-500 rotate-180" /> Return Departure
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                min={new Date().toISOString().slice(0, 16)}
                                                                {...register(`travelers.${index}.returnDepartureTime` as const)}
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white cursor-pointer hover:border-amber-300 transition-colors"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                                <Plane size={12} className="text-green-400 rotate-90" /> Return Arrival
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                min={new Date().toISOString().slice(0, 16)}
                                                                {...register(`travelers.${index}.returnArrivalTime` as const)}
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white cursor-pointer hover:border-amber-300 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => append(emptyTraveler)}
                        className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors w-full justify-center p-3 border border-dashed border-indigo-300 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                    >
                        <Plus size={16} />
                        <span>+ Add Another Member</span>
                    </button>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                            Save Travelers
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
