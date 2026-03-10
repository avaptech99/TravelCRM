import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/client';
import type { Booking } from '../types';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Plane, CreditCard, ArrowLeft, Users, FileText } from 'lucide-react';

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
});

const formSchema = z.object({
    travelers: z.array(travelerSchema).min(1, 'At least one traveler is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const BookingTravelers: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [pricePerTicket, setPricePerTicket] = useState<number>(0);
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [paymentTransactionId, setPaymentTransactionId] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [paymentRemarks, setPaymentRemarks] = useState<string>('');

    const { data: booking, isLoading } = useQuery({
        queryKey: ['booking', id],
        queryFn: async () => {
            const { data } = await api.get(`/bookings/${id}`);
            return data as Booking;
        },
        enabled: !!id,
    });

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

    const travelersWatch = watch('travelers');
    const totalPayment = (travelersWatch?.length || 0) * (pricePerTicket || 0);

    const totalPaid = booking?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const currentOutstanding = totalPayment - totalPaid;
    const finalOutstanding = currentOutstanding - parseFloat(paymentAmount || '0');

    useEffect(() => {
        if (booking) {
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
                reset({ travelers: [emptyTraveler] });
            }

            if (booking.pricePerTicket) {
                setPricePerTicket(booking.pricePerTicket);
            }
        }
    }, [booking, reset]);

    const deletePaymentMutation = useMutation({
        mutationFn: async (paymentId: string) => {
            await api.delete(`/bookings/${id}/payments/${paymentId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            toast.success('Payment deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete payment');
        },
    });

    const recordPaymentMutation = useMutation({
        mutationFn: async () => {
            const payAmt = parseFloat(paymentAmount);
            if (isNaN(payAmt) || payAmt <= 0) {
                throw new Error('Please enter a valid payment amount');
            }

            if (payAmt > currentOutstanding + 0.01) { // Allowing small float margin
                throw new Error(`Payment cannot exceed outstanding amount ($${currentOutstanding.toFixed(2)})`);
            }

            await api.post(`/bookings/${id}/payments`, {
                amount: payAmt,
                paymentMethod,
                transactionId: paymentTransactionId || undefined,
                date: new Date(paymentDate).toISOString(),
                remarks: paymentRemarks || undefined
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            toast.success('Payment recorded successfully');
            setPaymentAmount('');
            setPaymentTransactionId('');
            setPaymentRemarks('');
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.message || 'Failed to record payment');
        },
    });

    const saveChangesMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const promises = [];

            // 1. Save Travelers
            const hasExisting = booking?.travelers && booking.travelers.length > 0;
            if (hasExisting) {
                promises.push(api.put(`/bookings/${id}/travelers`, data.travelers));
            } else {
                promises.push(api.post(`/bookings/${id}/travelers`, data.travelers));
            }

            // 2. Save Pricing
            promises.push(api.put(`/bookings/${id}`, {
                pricePerTicket: Number(pricePerTicket),
                totalAmount: totalPayment
            }));

            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            toast.success('Configuration saved successfully');
            navigate(`/bookings/${id}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to save changes');
        },
    });

    const onSubmit = (data: FormValues) => {
        saveChangesMutation.mutate(data);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading booking configuration...</div>;
    }

    if (!booking) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Booking not found.</p>
                <Link to="/bookings" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                    &larr; Back to Bookings
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Finalize Booking
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Configure travelers, pricing, and recorded payments for <span className="font-semibold text-slate-700">{booking.contactPerson}</span>
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* 1. TRAVELERS SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                        <Users size={18} className="text-indigo-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Traveler Details</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-5 bg-slate-50/50 border border-slate-200 rounded-lg relative">
                                <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-3">
                                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                                        Traveler {index === 0 ? '(Primary)' : ''}
                                    </h4>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1 text-sm font-medium"
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                                        <input
                                            {...register(`travelers.${index}.name` as const)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                                            placeholder="John Doe"
                                        />
                                        {errors.travelers?.[index]?.name && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.name?.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Phone Number {index > 0 ? '*' : ''}
                                        </label>
                                        <input
                                            {...register(`travelers.${index}.phoneNumber` as const, { required: index > 0 ? "Phone is required for additional members" : false })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                                            placeholder="+1 234 567 890"
                                        />
                                        {errors.travelers?.[index]?.phoneNumber && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.phoneNumber?.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Flow</label>
                                        <input
                                            {...register(`travelers.${index}.email` as const)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                                            placeholder="john@example.com"
                                        />
                                        {errors.travelers?.[index]?.email && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.email?.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-500" /> Date of Birth
                                            </label>
                                            <input
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                {...register(`travelers.${index}.dob` as const)}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-500" /> Anniversary
                                            </label>
                                            <input
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                {...register(`travelers.${index}.anniversary` as const)}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {index === 0 && (
                                        <div className="md:col-span-2 mt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100/60">
                                            <h5 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                                <Plane size={16} className="text-indigo-500" /> Primary Flight Details
                                            </h5>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination Country</label>
                                                    <input
                                                        {...register(`travelers.${index}.country` as const)}
                                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                                                        placeholder="e.g. France"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Flight From</label>
                                                        <input
                                                            {...register(`travelers.${index}.flightFrom` as const)}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase shadow-sm"
                                                            placeholder="JFK"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Flight To</label>
                                                        <input
                                                            {...register(`travelers.${index}.flightTo` as const)}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase shadow-sm"
                                                            placeholder="LHR"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                            <Plane size={13} className="text-indigo-400" /> Departure
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            {...register(`travelers.${index}.departureTime` as const)}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm cursor-pointer hover:border-indigo-300"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                            <Plane size={13} className="text-emerald-500 rotate-90" /> Arrival
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            {...register(`travelers.${index}.arrivalTime` as const)}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm cursor-pointer hover:border-indigo-300"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trip Type</label>
                                                    <select
                                                        {...register(`travelers.${index}.tripType` as const)}
                                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm cursor-pointer"
                                                    >
                                                        <option value="one-way">One Way</option>
                                                        <option value="round-trip">Round Trip</option>
                                                    </select>
                                                </div>

                                                {watch(`travelers.${index}.tripType`) === 'round-trip' && (
                                                    <div className="md:col-span-2 grid grid-cols-2 gap-3 mt-2 p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
                                                        <div className="col-span-2">
                                                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Return Flight</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                                <Plane size={13} className="text-amber-500 rotate-180" /> Return Departure
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                {...register(`travelers.${index}.returnDepartureTime` as const)}
                                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm cursor-pointer hover:border-amber-300"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                                <Plane size={13} className="text-emerald-500 rotate-90" /> Return Arrival
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                {...register(`travelers.${index}.returnArrivalTime` as const)}
                                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm cursor-pointer hover:border-amber-300"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => append(emptyTraveler)}
                            className="flex items-center space-x-2 text-indigo-700 hover:text-indigo-800 font-semibold text-sm transition-all w-full justify-center p-4 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl hover:bg-indigo-100/50 hover:border-indigo-300"
                        >
                            <Plus size={18} />
                            <span>Add Another Passenger</span>
                        </button>
                    </div>
                </div>

                {/* 2. PRICING SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-amber-600" />
                            <h2 className="text-base font-semibold text-slate-800">Pricing Information</h2>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                <span className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider">Passengers:</span>
                                <span className="text-indigo-900 font-bold text-base">{travelersWatch?.length || 0}</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">Rate: <span className="text-slate-900 font-bold">${pricePerTicket.toFixed(2)}</span></span>
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="flex flex-col md:flex-row items-stretch gap-4">
                            <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 p-4 flex flex-col justify-center">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Price Per Ticket</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 sm:text-sm font-semibold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={pricePerTicket || ''}
                                        onChange={(e) => setPricePerTicket(parseFloat(e.target.value) || 0)}
                                        className="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xl font-bold text-slate-800 transition-all shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="hidden md:flex items-center justify-center text-slate-300">
                                <Plus size={20} className="rotate-45" />
                            </div>

                            <div className="flex-1 bg-indigo-50/30 rounded-lg border border-indigo-100/50 p-4 flex flex-col justify-center items-center md:items-end">
                                <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1 items-center gap-1.5 flex">
                                    <CreditCard size={10} /> Total Payment Amount
                                </label>
                                <div className="text-4xl font-bold text-indigo-700 tracking-tight">
                                    <span className="text-2xl mr-0.5 font-semibold">$</span>{totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-indigo-400 font-medium mt-1">
                                    {travelersWatch?.length || 0} Passenger(s) × ${pricePerTicket.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. INLINE PAYMENT SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-2">
                        <CreditCard size={18} className="text-emerald-600" />
                        <h2 className="text-base font-semibold text-emerald-900">Add Payment</h2>
                    </div>

                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide px-1">Amount Rec.</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 sm:text-sm font-bold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={currentOutstanding > 0 ? currentOutstanding : 0}
                                        value={paymentAmount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setPaymentAmount('');
                                                return;
                                            }
                                            const num = parseFloat(val);
                                            if (!isNaN(num)) {
                                                // Clamp to currentOutstanding
                                                const clamped = Math.min(num, Math.max(0, currentOutstanding));
                                                setPaymentAmount(clamped.toString());
                                            }
                                        }}
                                        className="bg-white border border-slate-200 text-sm font-bold text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full pl-6 p-2.5 shadow-sm transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-center items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Outstanding</span>
                                <span className={`text-sm font-bold ${finalOutstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    ${finalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full p-2.5 shadow-sm transition-all h-[42px]"
                                >
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Check">Check</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Transaction ID</label>
                                <input
                                    type="text"
                                    value={paymentTransactionId}
                                    onChange={(e) => setPaymentTransactionId(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full p-2.5 shadow-sm transition-all h-[42px]"
                                    placeholder="Ref Code"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Date</label>
                                <input
                                    type="date"
                                    max={new Date().toISOString().split('T')[0]}
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full p-2.5 shadow-sm transition-all h-[42px]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Remarks / Notes</label>
                                <textarea
                                    value={paymentRemarks}
                                    onChange={(e) => setPaymentRemarks(e.target.value)}
                                    rows={1}
                                    className="bg-white border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full p-2.5 shadow-sm transition-all h-[42px] py-3"
                                    placeholder="Payment notes..."
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => recordPaymentMutation.mutate()}
                                disabled={recordPaymentMutation.isPending || !paymentAmount || parseFloat(paymentAmount) <= 0}
                                className="flex items-center justify-center gap-2 px-6 h-[42px] bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all whitespace-nowrap min-w-[140px]"
                            >
                                <Plus size={14} /> {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                            </button>
                        </div>

                        {/* Existing Payments List */}
                        {booking.payments && booking.payments.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recorded Payments</h3>
                                <div className="space-y-2">
                                    {booking.payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 text-xs shadow-sm hover:border-slate-200 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">${payment.amount.toFixed(2)}</span>
                                                    <span className="text-slate-500 text-[10px]">{new Date(payment.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="h-6 w-px bg-slate-200"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-600 font-medium">{payment.paymentMethod}</span>
                                                    <span className="text-slate-400 text-[10px]">{payment.transactionId || 'No Ref'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {payment.remarks && (
                                                    <div className="text-slate-500 italic max-w-[200px] truncate hidden md:block">
                                                        "{payment.remarks}"
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this payment record?')) {
                                                            deletePaymentMutation.mutate(payment.id);
                                                        }
                                                    }}
                                                    className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete payment"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-4 flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Paid</span>
                                            <span className="text-xl font-bold text-emerald-700">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-4 flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Final Balance</span>
                                            <span className={`text-xl font-bold ${currentOutstanding > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>
                                                ${currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submissions Actions */}
                <div className="flex justify-end space-x-4 pt-4 pb-8">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saveChangesMutation.isPending}
                        className="px-8 py-3 flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 border border-transparent rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {saveChangesMutation.isPending ? 'Saving All Changes...' : 'Save & Confirm Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
};
