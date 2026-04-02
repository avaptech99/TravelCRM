import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/client';
import type { Booking } from '../types';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Plane, CreditCard, ArrowLeft, Users, FileText, List } from 'lucide-react';
import { countryCodes } from '../utils/countryCodes';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const travelerBaseSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    countryCode: z.string(),
    phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional().or(z.literal('')),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    country: z.string().optional(),
    flightFrom: z.string().optional(),
    flightTo: z.string().optional(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    tripType: z.enum(['one-way', 'round-trip', 'multi-city']).optional(),
    returnDate: z.string().optional(),
    returnDepartureTime: z.string().optional(),
    returnArrivalTime: z.string().optional(),
    dob: z.string().min(1, 'Date of Birth is required'),
    anniversary: z.string().optional(),
});

const travelerSchema = travelerBaseSchema.superRefine((data, ctx) => {
    // Flight From and Flight To are compulsory IF any other flight details are provided
    const hasFlightDetails = !!(data.departureTime || data.arrivalTime || (data.tripType === 'round-trip') || data.returnDate || data.returnDepartureTime || data.returnArrivalTime);

    if (hasFlightDetails && (!data.flightFrom || data.flightFrom.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Flight From is required when entering flight details',
            path: ['flightFrom'],
        });
    }
    if (hasFlightDetails && (!data.flightTo || data.flightTo.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Flight To is required when entering flight details',
            path: ['flightTo'],
        });
    }

    // Arrival must be after Departure
    if (data.departureTime && data.arrivalTime) {
        if (dayjs(data.arrivalTime).isBefore(dayjs(data.departureTime))) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Arrival time cannot be before departure time',
                path: ['arrivalTime'],
            });
        }
    }

    // Return Arrival must be after Return Departure
    if (data.tripType === 'round-trip' && data.returnDepartureTime && data.returnArrivalTime) {
        if (dayjs(data.returnArrivalTime).isBefore(dayjs(data.returnDepartureTime))) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Return arrival time cannot be before return departure time',
                path: ['returnArrivalTime'],
            });
        }
    }

    // Return Flight must be after Initial Flight
    if (data.tripType === 'round-trip') {
        const initialDate = data.arrivalTime || data.departureTime;
        const returnDate = data.returnDepartureTime || data.returnDate;

        if (initialDate && returnDate) {
            if (dayjs(returnDate).isBefore(dayjs(initialDate))) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Return flight cannot be earlier than the initial flight',
                    path: [data.returnDepartureTime ? 'returnDepartureTime' : 'returnDate'],
                });
            }
        }
    }
});

const formSchema = z.object({
    travelers: z.array(travelerSchema).min(1, 'At least one traveler is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const BookingTravelers: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Marketers should not access this page
    useEffect(() => {
        if (user?.role === 'MARKETER') {
            toast.error('Marketers are not authorized to manage travelers');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const [lumpSumAmount, setLumpSumAmount] = useState<number>(0);
    const [finalQuotationAmount, setFinalQuotationAmount] = useState<string>('0');
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [paymentTransactionId, setPaymentTransactionId] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [paymentRemarks, setPaymentRemarks] = useState<string>('');
    const [keepSameContact, setKeepSameContact] = useState<boolean>(true);
    const [segments, setSegments] = useState<{ from: string; to: string; date: string }[]>([]);

    const isInitialized = useRef(false);
    const todayString = new Date().toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:mm

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
        countryCode: '+91',
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
        setValue,
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
    // Total payment is just the lump sum now
    const totalPayment = lumpSumAmount || 0;

    const totalPaid = booking?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const currentOutstanding = totalPayment - totalPaid;
    const finalOutstanding = currentOutstanding - parseFloat(paymentAmount || '0');

    useEffect(() => {
        if (booking && !isInitialized.current) {
            if (booking.travelers && booking.travelers.length > 0) {
                reset({
                    travelers: booking.travelers.map(t => {
                        const rawPhone = t.phoneNumber || '';
                        let cCode = '+91';
                        let pNumber = rawPhone;

                        // Try to find the matching country code from our list
                        const matchedCC = countryCodes.find(cc => rawPhone.startsWith(cc.code));
                        if (matchedCC) {
                            cCode = matchedCC.code;
                            pNumber = rawPhone.slice(matchedCC.code.length);
                        }

                        return {
                            name: t.name || '',
                            countryCode: cCode,
                            phoneNumber: pNumber,
                            email: t.email || '',
                            country: t.country || '',
                            flightFrom: t.flightFrom || booking.flightFrom || '',
                            flightTo: t.flightTo || booking.flightTo || '',
                            departureTime: t.departureTime || (booking.travelDate ? new Date(booking.travelDate).toISOString().split('T')[0] : ''),
                            arrivalTime: t.arrivalTime || '',
                            tripType: (t.tripType || booking.tripType || 'one-way') as 'one-way' | 'round-trip' | 'multi-city',
                            returnDate: t.returnDate || '',
                            returnDepartureTime: t.returnDepartureTime || (booking.returnDate ? new Date(booking.returnDate).toISOString().split('T')[0] : ''),
                            returnArrivalTime: t.returnArrivalTime || '',
                            dob: t.dob || '',
                            anniversary: t.anniversary || '',
                        };
                    }),
                });
            } else {
                // For new leads from WordPress, booking.travelers is empty.
                // We should initialize the primary traveler with booking-level contact and trip data.
                const rawPhone = booking.contactNumber || '';
                let cCode = '+91';
                let pNumber = rawPhone;

                const matchedCC = countryCodes.find(cc => rawPhone.startsWith(cc.code));
                if (matchedCC) {
                    cCode = matchedCC.code;
                    pNumber = rawPhone.slice(matchedCC.code.length);
                }

                reset({ 
                    travelers: [{
                        name: booking.contactPerson || '',
                        countryCode: cCode,
                        phoneNumber: pNumber,
                        email: booking.contactEmail || '',
                        country: booking.destinationCity || '',
                        flightFrom: booking.flightFrom || '',
                        flightTo: booking.flightTo || '',
                        departureTime: booking.travelDate ? new Date(booking.travelDate).toISOString().split('T')[0] : '',
                        arrivalTime: '',
                        tripType: (booking.tripType || 'one-way') as 'one-way' | 'round-trip' | 'multi-city',
                        returnDate: '',
                        returnDepartureTime: booking.returnDate ? new Date(booking.returnDate).toISOString().split('T')[0] : '',
                        returnArrivalTime: '',
                        dob: '',
                        anniversary: ''
                    }] 
                });
            }

            if (booking.totalAmount !== undefined && booking.totalAmount !== null) {
                setLumpSumAmount(booking.totalAmount);
            } else if (booking.pricePerTicket) {
                // Fallback for older records
                const passengerCount = booking.travelers ? booking.travelers.length : 1;
                setLumpSumAmount(booking.pricePerTicket * passengerCount);
            }

            if (booking.finalQuotation) {
                setFinalQuotationAmount(booking.finalQuotation);
            } else if (booking.uniqueCode) {
                setFinalQuotationAmount(`${booking.uniqueCode}-A`);
            }

            if (booking.bookingType === 'B2B') {
               setKeepSameContact(true);
            } else {
               setKeepSameContact(false);
            }
            if (booking.segments && booking.segments.length > 0) {
                setSegments(booking.segments.map(s => ({
                    from: s.from || '',
                    to: s.to || '',
                    date: s.date ? new Date(s.date).toISOString().split('T')[0] : ''
                })));
            } else {
                setSegments([{ from: '', to: '', date: '' }]);
            }

            isInitialized.current = true;
        }
    }, [booking, reset]);

    // Effect for "Keep Same" checkbox logic
    useEffect(() => {
        if (keepSameContact && fields.length > 1) {
             const primaryPhone = watch('travelers.0.phoneNumber');
             const primaryCode = watch('travelers.0.countryCode');
             const primaryEmail = watch('travelers.0.email');
             
             const currentTravelers = watch('travelers');
             let hasChanges = false;
             
             for(let i = 1; i < currentTravelers.length; i++) {
                 if (currentTravelers[i].phoneNumber !== primaryPhone || 
                     currentTravelers[i].countryCode !== primaryCode || 
                     currentTravelers[i].email !== primaryEmail) {
                         currentTravelers[i].phoneNumber = primaryPhone;
                         currentTravelers[i].countryCode = primaryCode;
                         currentTravelers[i].email = primaryEmail;
                         hasChanges = true;
                 }
             }
             if (hasChanges) {
                  setValue('travelers', currentTravelers);
             }
        }
    }, [keepSameContact, watch('travelers.0.phoneNumber'), watch('travelers.0.countryCode'), watch('travelers.0.email'), fields.length, watch, setValue]);


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
            const travelersWithCombinedPhone = data.travelers.map(t => ({
                ...t,
                phoneNumber: t.phoneNumber ? `${t.countryCode}${t.phoneNumber}` : ''
            }));

            const hasExisting = booking?.travelers && booking.travelers.length > 0;
            if (hasExisting) {
                promises.push(api.put(`/bookings/${id}/passengers`, travelersWithCombinedPhone));
            } else {
                promises.push(api.post(`/bookings/${id}/passengers`, travelersWithCombinedPhone));
            }

            // 2. Save Pricing
            // Since we moved to lump sum, pricePerTicket will be derived or just stored as 0
            const passengerCount = data.travelers.length || 1;
            const derivedPricePerTicket = totalPayment / passengerCount;
            const primaryTraveler = data.travelers[0];

            promises.push(api.put(`/bookings/${id}`, {
                pricePerTicket: derivedPricePerTicket,
                amount: lumpSumAmount || 0,
                totalAmount: lumpSumAmount || 0,
                finalQuotation: finalQuotationAmount,
                flightFrom: primaryTraveler?.flightFrom || null,
                flightTo: primaryTraveler?.flightTo || null,
                tripType: primaryTraveler?.tripType || 'one-way',
                segments: segments.filter(s => s.from || s.to),
            }));

            // 3. Auto-update status to Booked if payment exists
            if (totalPaid > 0) {
                promises.push(api.patch(`/bookings/${id}/status`, { status: 'Booked' }));
            }

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
                <Link to="/bookings" className="mt-4 inline-block text-primary hover:opacity-80">
                    &larr; Back to Bookings
                </Link>
            </div>
        );
    }

    const quotationSuffixes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const currentOptionIndex = quotationSuffixes.findIndex(suffix => 
        finalQuotationAmount === (booking?.uniqueCode ? `${booking.uniqueCode}-${suffix}` : suffix)
    );
    const maxOptionIndex = Math.min(Math.max(0, currentOptionIndex + 1), quotationSuffixes.length - 1);
    const availableOptions = quotationSuffixes.slice(0, maxOptionIndex + 1).map(suffix => 
        booking?.uniqueCode ? `${booking.uniqueCode}-${suffix}` : suffix
    );

    return (
        <div className="max-w-5xl mx-auto pb-28 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-0">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6 sm:mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Finalize Booking
                    </h1>
                    {/* @ts-ignore */}
                    <p className="text-slate-500 text-sm mt-1">
                        Configure travelers, pricing, and recorded payments for <span className="font-semibold text-slate-700">{booking.contactPerson}</span>
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Final Quotation Section */}
                <div className="bg-brand-gradient p-0.5 rounded-xl shadow-lg transform transition-all hover:scale-[1.01]">
                    <div className="bg-white rounded-[10px] p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <CreditCard size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-medium text-slate-900">Final Quotation No.</h2>
                                </div>
                            </div>
                            <div className="relative min-w-[240px]">
                                <select
                                    value={finalQuotationAmount}
                                    onChange={(e) => setFinalQuotationAmount(e.target.value)}
                                    className="w-full px-4 py-4 bg-slate-50 border-2 border-primary/20 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-2xl font-medium text-slate-800 transition-all shadow-inner cursor-pointer appearance-none"
                                >
                                    <option value="" disabled>Select quotation...</option>
                                    {availableOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1. TRAVELERS SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2">
                        <Users size={18} className="text-secondary" />
                        <h2 className="text-lg font-semibold text-slate-800">Traveler Details</h2>
                    </div>

                    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                        {fields.map((field, index) => (
                            <React.Fragment key={field.id}>
                                {index === 1 && (
                                    <div className="flex items-center gap-2 p-3 mb-4 bg-secondary/5 rounded-lg border border-secondary/10">
                                        <input 
                                            type="checkbox" 
                                            id="keepSameContact" 
                                            checked={keepSameContact} 
                                            onChange={(e) => setKeepSameContact(e.target.checked)}
                                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                        />
                                        <label htmlFor="keepSameContact" className="text-sm font-medium text-slate-700 font-semibold text-secondary">
                                            Keep email and phone number same as primary traveler
                                        </label>
                                    </div>
                                )}
                                <div className="p-4 sm:p-5 bg-slate-50/50 border border-slate-200 rounded-lg relative">

                                <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-3">
                                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="bg-secondary/10 text-secondary w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
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
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm"
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
                                        <div className="flex gap-2">
                                            <select
                                                {...register(`travelers.${index}.countryCode` as const)}
                                                className="w-[100px] px-2 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm"
                                            >
                                                {countryCodes.map(cc => (
                                                    <option key={cc.code} value={cc.code}>{cc.code} ({cc.name})</option>
                                                ))}
                                            </select>
                                            <input
                                                {...register(`travelers.${index}.phoneNumber` as const)}
                                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm"
                                                placeholder="9876543210"
                                            />
                                        </div>
                                        {errors.travelers?.[index]?.phoneNumber && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.phoneNumber?.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Flow</label>
                                        <input
                                            {...register(`travelers.${index}.email` as const)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm"
                                            placeholder="john@example.com"
                                        />
                                        {errors.travelers?.[index]?.email && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.email?.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-500" /> Date of Birth *
                                            </label>
                                            <input
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                {...register(`travelers.${index}.dob` as const)}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                                            />
                                            {errors.travelers?.[index]?.dob && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.dob?.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-500" /> Anniversary
                                            </label>
                                            <input
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                {...register(`travelers.${index}.anniversary` as const)}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {index === 0 && (
                                        <div className="md:col-span-2 mt-4 p-4 bg-secondary/5 rounded-lg border border-secondary/10">
                                            <h5 className="text-sm font-bold text-secondary mb-4 flex items-center gap-2">
                                                <Plane size={16} className="text-secondary" /> Primary Flight Details
                                            </h5>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination Country</label>
                                                    <input
                                                        {...register(`travelers.${index}.country` as const)}
                                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm"
                                                        placeholder="e.g. France"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Flight From <span className="text-red-500">*</span></label>
                                                        <input
                                                            {...register(`travelers.${index}.flightFrom` as const, {
                                                                onChange: (e) => (e.target.value = e.target.value.toUpperCase()),
                                                            })}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase shadow-sm"
                                                            placeholder="JFK"
                                                        />
                                                        {errors.travelers?.[index]?.flightFrom && (
                                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.flightFrom?.message}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Flight To <span className="text-red-500">*</span></label>
                                                        <input
                                                            {...register(`travelers.${index}.flightTo` as const, {
                                                                onChange: (e) => (e.target.value = e.target.value.toUpperCase()),
                                                            })}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase shadow-sm"
                                                            placeholder="LHR"
                                                        />
                                                        {errors.travelers?.[index]?.flightTo && (
                                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.flightTo?.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                            <Plane size={13} className="text-secondary" /> Departure Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            min={todayString.split('T')[0]}
                                                            {...register(`travelers.${index}.departureTime` as const)}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm cursor-pointer hover:border-indigo-300"
                                                        />
                                                        {errors.travelers?.[index]?.departureTime && (
                                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.departureTime?.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trip Type</label>
                                                    <select
                                                        {...register(`travelers.${index}.tripType` as const)}
                                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm cursor-pointer"
                                                    >
                                                        <option value="one-way">One Way</option>
                                                        <option value="round-trip">Round Trip</option>
                                                        <option value="multi-city">Multi City</option>
                                                    </select>
                                                </div>

                                                 {watch(`travelers.${index}.tripType`) === 'round-trip' && (
                                                     <div className="md:col-span-1 mt-2 p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
                                                         <div className="border-b border-amber-200/50 pb-2 mb-3">
                                                             <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Return Flight</p>
                                                         </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                                <Plane size={13} className="text-amber-500 rotate-180" /> Return Date
                                                            </label>
                                                            <input
                                                                type="date"
                                                                min={todayString.split('T')[0]}
                                                                {...register(`travelers.${index}.returnDepartureTime` as const)}
                                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm cursor-pointer hover:border-amber-300"
                                                            />
                                                            {errors.travelers?.[index]?.returnDepartureTime && (
                                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.travelers[index]?.returnDepartureTime?.message}</p>
                                                            )}
                                                        </div>
                                                        <div className="hidden md:block"></div>
                                                    </div>
                                                )}
                                                 {watch(`travelers.${index}.tripType`) === 'multi-city' && (
                                                     <div className="md:col-span-2 mt-4 space-y-4">
                                                         <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                                <List size={14} className="text-secondary" /> Multi-City segments (Next Legs)
                                                            </h5>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSegments([...segments, { from: '', to: '', date: '' }])}
                                                                className="text-[10px] bg-secondary/10 text-secondary px-2 py-1 rounded font-bold hover:bg-secondary/20 transition-colors uppercase tracking-wider"
                                                            >
                                                                + Add Segment
                                                            </button>
                                                         </div>
                                                         
                                                         <div className="space-y-3">
                                                            {segments.map((segment, sIdx) => (
                                                                <div key={sIdx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                                                                    <div className="md:col-span-3">
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={segment.from}
                                                                            onChange={(e) => {
                                                                                const newSegments = [...segments];
                                                                                newSegments[sIdx].from = e.target.value.toUpperCase();
                                                                                setSegments(newSegments);
                                                                            }}
                                                                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-secondary uppercase"
                                                                            placeholder="Leg From"
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-3">
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={segment.to}
                                                                            onChange={(e) => {
                                                                                const newSegments = [...segments];
                                                                                newSegments[sIdx].to = e.target.value.toUpperCase();
                                                                                setSegments(newSegments);
                                                                            }}
                                                                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-secondary uppercase"
                                                                            placeholder="Leg To"
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-4">
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                                                                        <input 
                                                                            type="date"
                                                                            value={segment.date || ''}
                                                                            min={sIdx === 0 ? watch(`travelers.${index}.departureTime`) : segments[sIdx - 1].date}
                                                                            onChange={(e) => {
                                                                                const newSegments = [...segments];
                                                                                newSegments[sIdx].date = e.target.value;
                                                                                setSegments(newSegments);
                                                                            }}
                                                                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-secondary"
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-2">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => setSegments(segments.filter((_, i) => i !== sIdx))}
                                                                            className="w-full py-1.5 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors flex items-center justify-center"
                                                                            title="Remove segment"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {segments.length === 0 && (
                                                                <p className="text-xs text-slate-400 italic text-center py-2">No additional segments added yet.</p>
                                                            )}
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     )}
                                </div>
                            </div>
                        </React.Fragment>
                    ))}

                        <button
                            type="button"
                            onClick={() => append(emptyTraveler, { shouldFocus: false })}
                            className="flex items-center space-x-2 text-secondary hover:opacity-80 font-semibold text-sm transition-all w-full justify-center p-4 border-2 border-dashed border-secondary/20 bg-secondary/5 rounded-xl hover:bg-secondary/10 hover:border-secondary/30"
                        >
                            <Plus size={18} />
                            <span>Add Another Passenger</span>
                        </button>
                    </div>

                </div>

                {/* 2. PRICING SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-amber-600" />
                            <h2 className="text-base font-semibold text-slate-800">Pricing Information</h2>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <div className="flex items-center gap-1.5 bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                <span className="text-secondary text-[10px] font-bold uppercase tracking-wider">Passengers:</span>
                                <span className="text-secondary font-bold text-base">{travelersWatch?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="flex flex-col md:flex-row items-stretch gap-4">
                            <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 p-4 flex flex-col justify-center">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lump Sum Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 sm:text-sm font-semibold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={lumpSumAmount || ''}
                                        onChange={(e) => setLumpSumAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xl font-bold text-slate-800 transition-all shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="hidden md:flex items-center justify-center text-slate-300">
                                <Plus size={20} className="rotate-45" /> {/* Keep icon but no multiplication */}
                            </div>

                            <div className="flex-1 bg-secondary/5 rounded-lg border border-secondary/10 p-4 flex flex-col justify-center items-center md:items-end">
                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1 items-center gap-1.5 flex">
                                    <CreditCard size={10} /> Total Payment Amount
                                </label>
                                <div className="text-4xl font-bold text-secondary tracking-tight">
                                    {totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. INLINE PAYMENT SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-emerald-50 border-b border-emerald-100 px-4 sm:px-6 py-3 flex items-center gap-2">
                        <CreditCard size={18} className="text-emerald-600" />
                        <h2 className="text-base font-semibold text-emerald-900">Add Payment</h2>
                    </div>

                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide px-1">Amount Rec.</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                    {finalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 pb-8">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-center"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saveChangesMutation.isPending}
                        className="w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 text-sm font-bold text-white bg-brand-gradient border border-transparent rounded-xl shadow-md hover:opacity-90 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {saveChangesMutation.isPending ? 'Saving All Changes...' : 'Save & Confirm Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
};
