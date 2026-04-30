import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/client';
import type { Booking } from '../types';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Plane, CreditCard, ArrowLeft, Users, FileText, List, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { Controller } from 'react-hook-form';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem 
} from '../components/ui/dropdown-menu';
import { countryCodes } from '../utils/countryCodes';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const quotationSuffixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

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
    
    // New feature flags
    const [includesFlight, setIncludesFlight] = useState<boolean>(true);
    const [includesAdditionalServices, setIncludesAdditionalServices] = useState<boolean>(false);
    const [additionalServicesDetails, setAdditionalServicesDetails] = useState<string>('');
    const [companyName, setCompanyName] = useState<string>('');
    const [estimatedCosts, setEstimatedCosts] = useState<any[]>([]);
    const [estimatedMargin, setEstimatedMargin] = useState<number>(0);
    const [showCostSelector, setShowCostSelector] = useState<boolean>(false);

    // Collapsible sections state
    const [isTravelServicesExpanded, setIsTravelServicesExpanded] = useState(true);
    const [isTravelerDetailsExpanded, setIsTravelerDetailsExpanded] = useState(true);
    const [isPricingExpanded, setIsPricingExpanded] = useState(true);
    const [isPaymentExpanded, setIsPaymentExpanded] = useState(true);

    const toggleAdditionalService = (service: string) => {
        setAdditionalServicesDetails(prev => {
            const current = prev || '';
            const lines = current.split('\n').map(s => s.trim()).filter(s => s);
            const targetPrefix = `${service}-`;
            const existingIndex = lines.findIndex(l => l.startsWith(targetPrefix));
            
            if (existingIndex !== -1) {
                // If it exists (even with content), remove it
                return lines.filter((_, i) => i !== existingIndex).join('\n');
            } else {
                // If it doesn't exist, add it
                return [...lines, targetPrefix].join('\n');
            }
        });
    };

    const { data: dropdownSettings } = useQuery({
        queryKey: ['dropdown-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings/dropdowns');
            return data as Record<string, string[]>;
        },
    });

    const isInitialized = useRef(false);
    const todayString = new Date().toISOString().slice(0, 16);

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
            } else {
                setFinalQuotationAmount('');
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

            if (booking.includesFlight !== undefined) setIncludesFlight(booking.includesFlight);
            if (booking.includesAdditionalServices !== undefined) setIncludesAdditionalServices(booking.includesAdditionalServices);
            if (booking.additionalServicesDetails) setAdditionalServicesDetails(booking.additionalServicesDetails);
            if (booking.companyName) setCompanyName(booking.companyName);
            if (booking.estimatedCosts) setEstimatedCosts(booking.estimatedCosts);
            if (booking.estimatedMargin) setEstimatedMargin(booking.estimatedMargin);

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

            // Removed strict validation to allow entering payments before finalizing lump sum
            // if (payAmt > currentOutstanding + 0.01) { 
            //     throw new Error(`Payment cannot exceed outstanding amount (${currentOutstanding.toFixed(2)})`);
            // }

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
                segments: primaryTraveler?.tripType === 'multi-city' ? segments.filter(s => s.from || s.to) : [],
                includesFlight: includesFlight,
                includesAdditionalServices: includesAdditionalServices,
                additionalServicesDetails: includesAdditionalServices ? additionalServicesDetails : null,
                companyName: companyName || null,
                estimatedCosts: estimatedCosts.map(c => ({
                    costType: c.costType,
                    price: parseFloat(c.price?.toString() || '0'),
                    source: c.source || ''
                })),
                estimatedMargin: estimatedMargin,
            }));

            // 3. Optional: Record Pending Payment if filled but not "clicked"
            const payAmt = parseFloat(paymentAmount);
            if (!isNaN(payAmt) && payAmt > 0) {
                promises.push(api.post(`/bookings/${id}/payments`, {
                    amount: payAmt,
                    paymentMethod,
                    transactionId: paymentTransactionId || undefined,
                    date: new Date(paymentDate).toISOString(),
                    remarks: paymentRemarks || undefined
                }));
            }

            // Removed auto-update status to Booked as per user feedback
            // if (totalPaid > 0 || (!isNaN(payAmt) && payAmt > 0)) {
            //     promises.push(api.patch(`/bookings/${id}/status`, { status: 'Booked' }));
            // }

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

    const availableOptions = quotationSuffixes.map(suffix => 
        booking?.uniqueCode ? `${booking.uniqueCode}-${suffix}` : suffix
    );

    return (
        <div className="max-w-5xl mx-auto pb-28 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-0">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6 sm:mb-8">
                <button onClick={() => navigate(`/bookings/${id}`)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button 
                                            type="button"
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-primary/20 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-lg font-medium text-slate-800 transition-all shadow-inner cursor-pointer flex items-center justify-between group hover:border-primary hover:bg-primary/5"
                                        >
                                            <span>{finalQuotationAmount || 'Select quotation...'}</span>
                                            <ChevronDown size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                                        {availableOptions.map(opt => (
                                            <DropdownMenuItem 
                                                key={opt} 
                                                onClick={() => setFinalQuotationAmount(opt)}
                                                className="px-4 py-3 text-lg font-medium text-slate-700 hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                            >
                                                {opt}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Company Name Dropdown */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                        <FileText size={18} />
                                    </div>
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Company Name</label>
                                </div>
                                <div className="relative min-w-[240px]">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button 
                                                type="button"
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-primary/20 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-lg font-medium text-slate-800 transition-all shadow-inner cursor-pointer flex items-center justify-between group hover:border-primary hover:bg-primary/5"
                                            >
                                                <span>{companyName || 'Select Company'}</span>
                                                <ChevronDown size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                                            {dropdownSettings?.companies?.map((c: string) => (
                                                <DropdownMenuItem 
                                                    key={c} 
                                                    onClick={() => setCompanyName(c)}
                                                    className="px-4 py-3 text-lg font-medium text-slate-700 hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                                >
                                                    {c}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div 
                        className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
                        onClick={() => setIsTravelServicesExpanded(!isTravelServicesExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <Plane size={18} className="text-secondary" />
                            <h2 className="text-lg font-semibold text-slate-800">Travel Services</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isTravelServicesExpanded && (
                                <div className="flex gap-2">
                                    {includesFlight && (
                                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase tracking-wider flex items-center gap-1">
                                            {(() => {
                                                const t = travelersWatch?.[0];
                                                const type = t?.tripType || 'one-way';
                                                const from = t?.flightFrom?.toUpperCase();
                                                const to = t?.flightTo?.toUpperCase();
                                                
                                                if (from && to) {
                                                    if (type === 'round-trip') return <>{from} <span className="text-blue-400 text-[12px] leading-none">⇌</span> {to}</>;
                                                    if (type === 'one-way') return <>{from} <span className="text-blue-400 text-[12px] leading-none">→</span> {to}</>;
                                                }
                                                if (type === 'multi-city') return 'Multi-City Route';
                                                
                                                return type.replace('-', ' ');
                                            })()}
                                        </span>
                                    )}
                                    {includesAdditionalServices && (
                                        <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100 uppercase tracking-wider">
                                            Add-ons
                                        </span>
                                    )}
                                </div>
                            )}
                            <ChevronDown 
                                size={20} 
                                className={`text-slate-400 transition-transform duration-300 ${isTravelServicesExpanded ? 'rotate-180' : ''}`} 
                            />
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${isTravelServicesExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="p-4 sm:p-6">
                        {/* Service Selection Bar */}
                        <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-all ${includesFlight ? 'bg-secondary' : 'bg-slate-200'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={includesFlight} 
                                        onChange={(e) => setIncludesFlight(e.target.checked)}
                                    />
                                    <div className={`bg-white w-3 h-3 rounded-full shadow-sm transition-all transform ${includesFlight ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${includesFlight ? 'text-secondary' : 'text-slate-500'}`}>Flight Services</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-all ${includesAdditionalServices ? 'bg-secondary' : 'bg-slate-200'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={includesAdditionalServices} 
                                        onChange={(e) => setIncludesAdditionalServices(e.target.checked)}
                                    />
                                    <div className={`bg-white w-3 h-3 rounded-full shadow-sm transition-all transform ${includesAdditionalServices ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${includesAdditionalServices ? 'text-secondary' : 'text-slate-500'}`}>Additional Services</span>
                            </label>
                        </div>
                        {includesFlight && (
                            <div className="mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 items-end">
                                    <div className="bg-slate-50/30 p-3 rounded-xl border border-slate-100 transition-all hover:border-slate-200">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                            <Plane size={12} className="text-slate-400" /> Destination Country
                                        </label>
                                        <input
                                            {...register(`travelers.0.country` as const)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold shadow-sm"
                                            placeholder="e.g. France"
                                        />
                                    </div>

                                    <div className="bg-slate-50/30 p-2 rounded-xl border border-slate-100">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 px-1 flex items-center gap-1.5">
                                            <List size={12} className="text-blue-600" /> Trip Type
                                        </label>
                                        <div className="flex h-[38px] p-1 bg-slate-100 rounded-lg border border-slate-200">
                                            {[
                                                { id: 'one-way', label: 'One Way' },
                                                { id: 'round-trip', label: 'Round Trip' },
                                                { id: 'multi-city', label: 'Multi City' }
                                            ].map((type) => {
                                                const currentType = watch('travelers.0.tripType');
                                                const isActive = currentType === type.id;
                                                return (
                                                    <button
                                                        key={type.id}
                                                        type="button"
                                                        onClick={() => setValue('travelers.0.tripType', type.id)}
                                                        className={`flex-1 text-[10px] font-bold rounded-md transition-all ${
                                                            isActive 
                                                                ? 'bg-white text-secondary shadow-sm ring-1 ring-slate-200' 
                                                                : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                    >
                                                        {type.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4">
                                    {/* Leg 1 (Primary Flight) */}
                                    <div className="bg-slate-50/50 p-3 pt-5 rounded-xl border border-slate-200 transition-all hover:border-secondary/30 relative group">
                                        {watch('travelers.0.tripType') === 'multi-city' && (
                                            <div className="absolute right-3 top-2 bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black text-slate-400 uppercase tracking-tighter shadow-sm z-10">
                                                Leg 1
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                                    <Plane size={12} className="text-red-500" /> Flight From *
                                                </label>
                                                <input
                                                    {...register(`travelers.0.flightFrom` as const)}
                                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary uppercase font-bold shadow-sm"
                                                    placeholder="DXB"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                                    <Plane size={12} className="text-red-500" /> Flight To *
                                                </label>
                                                <input
                                                    {...register(`travelers.0.flightTo` as const)}
                                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary uppercase font-bold shadow-sm"
                                                    placeholder="CDG"
                                                />
                                            </div>
                                            <div className="relative group">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-secondary" /> Departure Date
                                                </label>
                                                <div className="relative">
                                                    <Controller
                                                        control={control}
                                                        name="travelers.0.departureTime"
                                                        render={({ field }) => (
                                                            <DatePicker
                                                                selected={field.value ? dayjs(field.value).toDate() : null}
                                                                onChange={(date) => field.onChange(date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                                                minDate={dayjs().startOf('day').toDate()}
                                                                dateFormat="dd/MM/yyyy"
                                                                placeholderText="Select Date"
                                                                portalId="root"
                                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary font-bold shadow-sm cursor-pointer transition-all hover:bg-white"
                                                            />
                                                        )}
                                                    />
                                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary transition-colors pointer-events-none z-10" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Legs (Multi-City) */}
                                    {watch('travelers.0.tripType') === 'multi-city' && (
                                        <>
                                            {segments.map((segment, sIdx) => (
                                                <div key={sIdx} className="bg-slate-50/50 p-3 pt-5 rounded-xl border border-slate-200 transition-all hover:border-secondary/30 relative group">
                                                    <div className="absolute right-3 top-2 bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black text-slate-400 uppercase tracking-tighter shadow-sm z-10">
                                                        Leg {sIdx + 2}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                                                <Plane size={12} className="text-red-500" /> Flight From *
                                                            </label>
                                                            <input 
                                                                type="text"
                                                                value={segment.from}
                                                                onChange={(e) => {
                                                                    const newSegments = [...segments];
                                                                    newSegments[sIdx].from = e.target.value.toUpperCase();
                                                                    setSegments(newSegments);
                                                                }}
                                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary uppercase font-bold shadow-sm"
                                                                placeholder="FROM"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                                                <Plane size={12} className="text-red-500" /> Flight To *
                                                                </label>
                                                            <input 
                                                                type="text"
                                                                value={segment.to}
                                                                onChange={(e) => {
                                                                    const newSegments = [...segments];
                                                                    newSegments[sIdx].to = e.target.value.toUpperCase();
                                                                    setSegments(newSegments);
                                                                }}
                                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary uppercase font-bold shadow-sm"
                                                                placeholder="TO"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 group">
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                                                    <Calendar size={12} className="text-secondary" /> Departure Date
                                                                </label>
                                                                <div className="relative">
                                                                    <DatePicker
                                                                        selected={segment.date ? dayjs(segment.date).toDate() : null}
                                                                        onChange={(date) => {
                                                                            const newSegments = [...segments];
                                                                            newSegments[sIdx].date = date ? dayjs(date).format('YYYY-MM-DD') : '';
                                                                            setSegments(newSegments);
                                                                        }}
                                                                        minDate={sIdx === 0 
                                                                            ? (watch('travelers.0.departureTime') ? dayjs(watch('travelers.0.departureTime') as string).toDate() : dayjs().startOf('day').toDate()) 
                                                                            : (segments[sIdx-1].date ? dayjs(segments[sIdx-1].date).toDate() : dayjs().startOf('day').toDate())
                                                                        }
                                                                        dateFormat="dd/MM/yyyy"
                                                                        placeholderText="Select Date"
                                                                        portalId="root"
                                                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary font-bold shadow-sm cursor-pointer transition-all hover:bg-white"
                                                                    />
                                                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary transition-colors pointer-events-none z-10" />
                                                                </div>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSegments(segments.filter((_, i) => i !== sIdx))}
                                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="flex justify-center pt-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setSegments([...segments, { from: '', to: '', date: '' }])}
                                                    className="flex items-center gap-2 text-[10px] bg-white text-secondary px-6 py-2 rounded-full font-black hover:bg-secondary/5 transition-all uppercase tracking-widest border-2 border-secondary/10 shadow-sm hover:border-secondary/30"
                                                >
                                                    <Plus size={14} /> Add Next Leg
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Conditional Return Leg (Round-Trip) */}
                                {watch('travelers.0.tripType') === 'round-trip' && (
                                    <div className="bg-orange-50/30 p-3 pt-5 rounded-xl border border-orange-200 mt-2 transition-all hover:border-orange-300 relative group">
                                        <div className="absolute right-3 top-2 bg-white border border-orange-200 px-2 py-0.5 rounded text-[9px] font-black text-orange-600 uppercase tracking-tighter shadow-sm z-10">
                                            Return
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                            <div className="opacity-70">
                                                <label className="block text-[10px] font-bold text-orange-700 uppercase mb-1 flex items-center gap-1.5">
                                                    <Plane size={12} className="text-orange-500 rotate-180" /> Flight From
                                                </label>
                                                <div className="w-full px-3 py-1.5 bg-orange-100/50 border border-orange-200 rounded text-sm font-bold text-orange-800 shadow-sm">
                                                    {watch('travelers.0.flightTo') || '---'}
                                                </div>
                                            </div>
                                            <div className="opacity-70">
                                                <label className="block text-[10px] font-bold text-orange-700 uppercase mb-1 flex items-center gap-1.5">
                                                    <Plane size={12} className="text-orange-500 rotate-180" /> Flight To
                                                </label>
                                                <div className="w-full px-3 py-1.5 bg-orange-100/50 border border-orange-200 rounded text-sm font-bold text-orange-800 shadow-sm">
                                                    {watch('travelers.0.flightFrom') || '---'}
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <label className="block text-[10px] font-bold text-orange-700 uppercase mb-1 flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-orange-600" /> Return Date
                                                </label>
                                                <div className="relative">
                                                    <Controller
                                                        control={control}
                                                        name="travelers.0.returnDepartureTime"
                                                        render={({ field }) => (
                                                            <DatePicker
                                                                selected={field.value ? dayjs(field.value).toDate() : null}
                                                                onChange={(date) => field.onChange(date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                                                minDate={watch('travelers.0.departureTime') ? dayjs(watch('travelers.0.departureTime') as string).toDate() : dayjs().startOf('day').toDate()}
                                                                dateFormat="dd/MM/yyyy"
                                                                placeholderText="Select Date"
                                                                portalId="root"
                                                                className="w-full pl-9 pr-3 py-2 bg-orange-50/50 border border-orange-200 rounded-lg text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold shadow-sm cursor-pointer transition-all hover:bg-white"
                                                            />
                                                        )}
                                                    />
                                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 transition-colors pointer-events-none z-10" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {includesAdditionalServices && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h5 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <List size={16} className="text-secondary" /> Additional Services
                                </h5>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {['Visa', 'Hotel', 'Package'].map(service => {
                                        const isActive = (additionalServicesDetails || '').split('\n').some(line => line.trim().startsWith(`${service}-`));
                                        return (
                                            <button
                                                key={service}
                                                type="button"
                                                onClick={() => toggleAdditionalService(service)}
                                                className={`px-6 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                                                    isActive 
                                                    ? 'bg-secondary border-secondary text-white shadow-lg scale-105' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-secondary/50 hover:bg-secondary/5'
                                                }`}
                                            >
                                                {service}
                                            </button>
                                        );
                                    })}
                                </div>

                                <textarea
                                    value={additionalServicesDetails}
                                    onChange={(e) => setAdditionalServicesDetails(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary text-sm shadow-inner transition-all"
                                    placeholder="Enter details..."
                                ></textarea>
                            </div>
                        )}
                    </div>
                </div>
                </div>

                {/* 2. TRAVELERS SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div 
                        className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
                        onClick={() => setIsTravelerDetailsExpanded(!isTravelerDetailsExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-secondary" />
                            <h2 className="text-lg font-semibold text-slate-800">Traveler Details</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 uppercase tracking-wider">
                                {fields.length} {fields.length === 1 ? 'Passenger' : 'Passengers'}
                            </span>
                            <ChevronDown 
                                size={20} 
                                className={`text-slate-400 transition-transform duration-300 ${isTravelerDetailsExpanded ? 'rotate-180' : ''}`} 
                            />
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${isTravelerDetailsExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                        {/* TRAVELERS LOOP START */}

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
                </div>

                {/* 2. PRICING SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div 
                        className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
                        onClick={() => setIsPricingExpanded(!isPricingExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-amber-600" />
                            <h2 className="text-base font-semibold text-slate-800">Pricing Information</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {!isPricingExpanded && lumpSumAmount > 0 && (
                                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                                    <span className="text-amber-700 text-[10px] font-bold uppercase tracking-wider">Total:</span>
                                    <span className="text-amber-800 font-semibold text-sm">{lumpSumAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <ChevronDown 
                                size={20} 
                                className={`text-slate-400 transition-transform duration-300 ${isPricingExpanded ? 'rotate-180' : ''}`} 
                            />
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${isPricingExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="p-5">
                        <div className="w-full bg-slate-50/50 rounded-lg border border-slate-100 p-6">
                            <div className="flex flex-col md:flex-row items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Lump Sum Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={lumpSumAmount || ''}
                                            onChange={(e) => setLumpSumAmount(parseFloat(e.target.value) || 0)}
                                            onWheel={(e) => (e.target as HTMLElement).blur()}
                                            className="w-full px-4 py-4 bg-white border-2 border-primary/20 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-lg font-bold text-slate-800 transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="md:w-48">
                                    <button
                                        type="button"
                                        onClick={() => setShowCostSelector(!showCostSelector)}
                                        className={`w-full px-4 py-4 rounded-xl border-2 font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
                                            showCostSelector 
                                            ? 'bg-secondary border-secondary text-white shadow-lg' 
                                            : 'bg-white border-secondary/20 text-secondary hover:bg-secondary/5 hover:border-secondary/40'
                                        }`}
                                    >
                                        <List size={16} />
                                        Manage Cost
                                    </button>
                                </div>
                            </div>

                            {showCostSelector && (
                                <div className="mt-6 pt-6 border-t border-secondary/10">
                                    <div className="mb-6">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select Cost Types</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Air Ticket', 'Hotel', 'Visa'].map(type => {
                                                const isActive = estimatedCosts.some(c => c.costType === type);
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isActive) {
                                                                setEstimatedCosts(prev => prev.filter(c => c.costType !== type));
                                                            } else {
                                                                setEstimatedCosts(prev => [...prev, { costType: type, price: 0, source: '' }]);
                                                            }
                                                        }}
                                                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                                                            isActive
                                                            ? 'bg-secondary border-secondary text-white shadow-lg scale-105'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-secondary/50 hover:bg-secondary/5'
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {estimatedCosts.length > 0 && (
                                        <div className="space-y-4">
                                            {estimatedCosts.map((cost, index) => (
                                                <div key={cost.costType} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm items-end">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Cost Type</label>
                                                        <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                                                            {cost.costType}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Price</label>
                                                        <input
                                                            type="number"
                                                            value={cost.price || ''}
                                                            onChange={(e) => {
                                                                const newCosts = [...estimatedCosts];
                                                                newCosts[index].price = parseFloat(e.target.value) || 0;
                                                                setEstimatedCosts(newCosts);
                                                            }}
                                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Source</label>
                                                        <select
                                                            value={cost.source || ''}
                                                            onChange={(e) => {
                                                                const newCosts = [...estimatedCosts];
                                                                newCosts[index].source = e.target.value;
                                                                setEstimatedCosts(newCosts);
                                                            }}
                                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm font-semibold h-[38px]"
                                                        >
                                                            <option value="">Select Source</option>
                                                            {(dropdownSettings?.suppliers || []).map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-8 pt-6 border-t border-secondary/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const totalCost = estimatedCosts.reduce((sum, c) => sum + (parseFloat(c.price?.toString() || '0')), 0);
                                                const salePrice = lumpSumAmount || 0;
                                                setEstimatedMargin(salePrice - totalCost);
                                                toast.success('Margin calculated successfully');
                                            }}
                                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                                        >
                                            <CreditCard size={18} />
                                            Auto-calculate Margin
                                        </button>

                                        <div className="flex items-center gap-4 bg-emerald-50 px-6 py-4 rounded-2xl border-2 border-emerald-100 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Estimated Margin</span>
                                                <span className={`text-lg font-black ${estimatedMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                    {estimatedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </div>

                {/* 3. INLINE PAYMENT SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div 
                        className="bg-emerald-50 border-b border-emerald-100 px-4 sm:px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-emerald-100/50 transition-colors"
                        onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <CreditCard size={18} className="text-emerald-600" />
                            <h2 className="text-base font-semibold text-emerald-900">Add Payment</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {!isPaymentExpanded && totalPaid > 0 && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                                    <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Paid:</span>
                                    <span className="text-emerald-800 font-semibold text-sm">{totalPaid.toLocaleString()}</span>
                                </div>
                            )}
                            {!isPaymentExpanded && currentOutstanding > 0 && (
                                <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-md border border-red-200">
                                    <span className="text-red-700 text-[10px] font-bold uppercase tracking-wider">Due:</span>
                                    <span className="text-red-800 font-semibold text-sm">{currentOutstanding.toLocaleString()}</span>
                                </div>
                            )}
                            {!isPaymentExpanded && currentOutstanding <= 0 && lumpSumAmount > 0 && (
                                <div className="flex items-center gap-1.5 bg-emerald-100 px-3 py-1 rounded-md border border-emerald-200">
                                    <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Paid in Full</span>
                                </div>
                            )}
                            <ChevronDown 
                                size={20} 
                                className={`text-emerald-400 transition-transform duration-300 ${isPaymentExpanded ? 'rotate-180' : ''}`} 
                            />
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${isPaymentExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
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
                                        value={paymentAmount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setPaymentAmount('');
                                                return;
                                            }
                                            const num = parseFloat(val);
                                            if (!isNaN(num)) {
                                                setPaymentAmount(num.toString());
                                            }
                                        }}
                                        onWheel={(e) => (e.target as HTMLElement).blur()}
                                        className="bg-white border border-slate-200 text-sm font-bold text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full pl-6 p-2.5 shadow-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide px-1">Outstanding</label>
                                <div className={`bg-slate-50 border border-slate-200 rounded-lg p-2.5 h-[42px] flex items-center shadow-sm`}>
                                    <span className={`text-sm font-bold w-full text-center ${finalOutstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {finalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
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
                                    {booking.payments.map((payment: any) => (
                                        <div key={payment._id || payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 text-xs shadow-sm hover:border-slate-200 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                                            deletePaymentMutation.mutate(payment._id || payment.id);
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
                                            <span className="text-xl font-bold text-emerald-700">{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-4 flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Final Balance</span>
                                            <span className={`text-xl font-bold ${currentOutstanding > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>
                                                {currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                </div>

                {/* Submissions Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 pb-8">
                    <button
                        type="button"
                        onClick={() => navigate(`/bookings/${id}`)}
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
