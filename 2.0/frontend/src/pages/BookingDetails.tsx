import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import dayjs from 'dayjs';
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, MessageSquare, Clock, Plane, Edit2, CreditCard, Plus, UserPlus, Building2, UserCircle, List, Users, ShieldCheck, Check, RotateCcw, ArrowLeftRight, Maximize2, X, Activity as ActivityIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddPaymentModal } from '../features/bookings/components/AddPaymentModal';
import { EditModal } from '../features/bookings/components/EditModal';
import { ContactEditModal } from '../features/bookings/components/ContactEditModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const BookingDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const { data: booking, isLoading, error } = useQuery<any, any>({
        queryKey: ['booking', id],
        queryFn: async () => {
            const { data } = await api.get(`/bookings/${id}`);
            return data;
        },
        enabled: !!id,
        retry: false, // Don't retry on 403
    });

    const [isEditingReqs, setIsEditingReqs] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isContactEditModalOpen, setIsContactEditModalOpen] = useState(false);
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const navigate = useNavigate();
    const [editReqsText, setEditReqsText] = useState('');
    const [commentText, setCommentText] = useState('');
    const { user } = useAuth();

    const queryClient = useQueryClient();

    const isMarketer = user?.role === 'MARKETER';
    const isAgent = user?.role === 'AGENT';
    const assignedId = booking?.assignedToUserId?._id || booking?.assignedToUserId;
    const isAssignedToMe = !!assignedId && String(assignedId) === user?.id;
    const isReadOnly = isAgent && !isAssignedToMe;
    
    // Marketers can only edit requirements if it's unassigned AND they created it (or admin/agent).
    // Now we refine this to follow the user's requirement: edit only if unassigned.
    const canEditReqs = !isReadOnly && (!isMarketer || (isMarketer && !assignedId));

    const assignToMeMutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/bookings/${id}/assign`, {
                assignedToUserId: user?.id
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            toast.success('Booking assigned to you successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to assign booking');
        }
    });

    const updateReqsMutation = useMutation({
        mutationFn: async (requirements: string) => {
            await api.put(`/bookings/${id}`, { requirements });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            setIsEditingReqs(false);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            await api.patch(`/bookings/${id}/status`, { status });
        },
        onMutate: async (newStatus) => {
            // Cancel outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['booking', id] });
            const previousBooking = queryClient.getQueryData(['booking', id]);
            // Optimistically update the booking status in the cache
            queryClient.setQueryData(['booking', id], (old: any) =>
                old ? { ...old, status: newStatus } : old
            );
            return { previousBooking };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success('Booking status updated successfully');
        },
        onError: (err: any, _variables, context) => {
            // Roll back to previous state on failure
            if (context?.previousBooking) {
                queryClient.setQueryData(['booking', id], context.previousBooking);
            }
            toast.error(err.response?.data?.message || 'Failed to update status');
        },
        onSettled: () => {
            // Always refetch to ensure server state is in sync
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
        },
    });

    const updateInterestMutation = useMutation({
        mutationFn: async (interested: string) => {
            await api.put(`/bookings/${id}`, { interested });
        },
        onMutate: async (newInterest) => {
            await queryClient.cancelQueries({ queryKey: ['booking', id] });
            const previousBooking = queryClient.getQueryData(['booking', id]);
            queryClient.setQueryData(['booking', id], (old: any) =>
                old ? { ...old, interested: newInterest } : old
            );
            return { previousBooking };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success('Interest updated successfully');
        },
        onError: (err: any, _variables, context) => {
            if (context?.previousBooking) {
                queryClient.setQueryData(['booking', id], context.previousBooking);
            }
            toast.error(err.response?.data?.message || 'Failed to update interest');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
        },
    });

    const addCommentMutation = useMutation({
        mutationFn: async (text: string) => {
            const { data } = await api.post(`/bookings/${id}/comments`, { text });
            return data;
        },
        onMutate: async (newText) => {
            await queryClient.cancelQueries({ queryKey: ['booking', id] });
            const previousBooking = queryClient.getQueryData(['booking', id]);
            // Optimistically add the comment to the list
            const optimisticComment = {
                id: `temp-${Date.now()}`,
                text: newText,
                createdBy: { name: user?.name || 'You', role: user?.role },
                createdAt: new Date().toISOString(),
            };
            queryClient.setQueryData(['booking', id], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    comments: [optimisticComment, ...(old.comments || [])],
                };
            });
            setCommentText('');
            return { previousBooking };
        },
        onSuccess: () => {
            toast.success('Comment added successfully');
        },
        onError: (err: any, _variables, context) => {
            if (context?.previousBooking) {
                queryClient.setQueryData(['booking', id], context.previousBooking);
            }
            toast.error(err.response?.data?.message || 'Failed to add comment');
        },
        onSettled: () => {
            // Refetch to replace optimistic comment with real server data (real ID, etc.)
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
        },
    });

    const verifyMutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/bookings/${id}/verify`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success('Booking verified successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to verify booking');
        }
    });

    const unverifyMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/bookings/${id}/verify`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success('Booking unverified successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to unverify booking');
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading booking details...</div>;
    }

    if (error) {
        const is403 = error.response?.status === 403;
        return (
            <div className="p-8 text-center text-slate-500">
                <p className="font-bold text-lg mb-2 text-slate-900">{is403 ? 'Access Denied' : 'Error'}</p>
                <p>{is403 ? 'You do not have permission to view this booking.' : (error.response?.data?.message || 'Something went wrong while fetching the booking.')}</p>
                <Link to="/bookings" className="mt-6 inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">
                    <ArrowLeft size={16} /> Back to Bookings
                </Link>
            </div>
        );
    }

    if (!booking && !isLoading) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p className="font-bold text-lg mb-2 text-slate-900">Booking not found.</p>
                <p>We couldn't find the booking you're looking for.</p>
                <Link to="/bookings" className="mt-6 inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">
                    <ArrowLeft size={16} /> Back to Bookings
                </Link>
            </div>
        );
    }

    const startEditingReqs = () => {
        setEditReqsText(booking.requirements || '');
        setIsEditingReqs(true);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 max-w-full">
                    <Link to={sessionStorage.getItem('bookingsReturnUrl') || "/bookings"} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0 mt-1 sm:mt-0 -ml-2 sm:ml-0">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
                            Booking for {booking.contactPerson}
                        </h1>
                        <div className="flex flex-wrap gap-2 items-center mt-2">
                            {booking.companyName && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-secondary rounded-lg text-[10px] sm:text-xs font-bold border border-slate-200 shadow-sm uppercase tracking-wider">
                                    <Building2 size={12} /> {booking.companyName}
                                </span>
                            )}
                            {booking.finalQuotation && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] sm:text-xs font-bold border border-red-100 shadow-sm uppercase tracking-wider">
                                    <CreditCard size={12} /> Final Quota: {booking.finalQuotation}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 text-[10px] sm:text-xs mt-1.5">
                            Created on {dayjs(booking.createdAt).format('MMM DD, YYYY h:mm A')} by {booking.createdByUser?.name}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center pl-8 sm:pl-0 w-full sm:w-auto">
                    {isReadOnly && (
                        <button
                            onClick={() => assignToMeMutation.mutate()}
                            disabled={assignToMeMutation.isPending}
                            className="text-sm flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
                        >
                            <UserPlus size={16} /> {assignToMeMutation.isPending ? 'Assigning...' : 'Assign To Me to Edit'}
                        </button>
                    )}
                    {!isReadOnly && !isMarketer ? (
                        <select
                            value={booking.status}
                            onChange={(e) => {
                                if (e.target.value === 'Booked') {
                                    navigate(`/bookings/${id}/travelers`);
                                } else {
                                    updateStatusMutation.mutate(e.target.value);
                                }
                            }}
                            disabled={updateStatusMutation.isPending}
                            className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 focus:outline-none focus:ring-opacity-50 transition-colors cursor-pointer disabled:opacity-50 ${booking.status === 'Booked' ? 'bg-green-100 text-green-800 border-green-200 focus:ring-green-500' :
                                booking.status === 'Working' ? 'bg-purple-100 text-purple-800 border-purple-200 focus:ring-purple-500' :
                                    booking.status === 'Sent' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 focus:ring-yellow-500' :
                                        'bg-blue-100 text-blue-800 border-blue-200 focus:ring-blue-500'
                                }`}
                        >
                            <option value="Pending" className="bg-white text-slate-800">Pending</option>
                            <option value="Working" className="bg-white text-slate-800">Working</option>
                            <option value="Sent" className="bg-white text-slate-800">Sent</option>
                            <option value="Booked" className="bg-white text-slate-800">Booked</option>
                        </select>
                    ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'Booked' ? 'bg-green-100 text-green-800' :
                            booking.status === 'Working' ? 'bg-purple-100 text-purple-800' :
                                booking.status === 'Sent' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                            }`}>
                            {booking.status}
                        </span>
                    )}
                    
                    {!isReadOnly && !isMarketer ? (
                        <select
                            value={booking.interested || 'No'}
                            onChange={(e) => updateInterestMutation.mutate(e.target.value)}
                            disabled={updateInterestMutation.isPending}
                            className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 focus:outline-none focus:ring-opacity-50 transition-colors cursor-pointer disabled:opacity-50 ${
                                booking.interested === 'Yes' 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 focus:ring-emerald-500' 
                                : 'bg-slate-100 text-slate-800 border-slate-200 focus:ring-slate-500'
                            }`}
                        >
                            <option value="Yes" className="bg-white text-slate-800">Interested</option>
                            <option value="No" className="bg-white text-slate-800">Not Interested</option>
                        </select>
                    ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${booking.interested === 'Yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {booking.interested === 'Yes' ? 'Interested' : 'Not Interested'}
                        </span>
                    )}

                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Requirements Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Detailed Requirements</h2>
                            {canEditReqs && (
                                <button
                                    onClick={startEditingReqs}
                                    className="text-sm flex items-center gap-1 text-primary hover:opacity-80 font-medium px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                            )}
                        </div>
                        <div className="prose prose-slate max-w-none">
                            {isEditingReqs ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={editReqsText}
                                        onChange={(e) => setEditReqsText(e.target.value)}
                                        className="w-full min-h-[150px] p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Enter detailed requirements..."
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateReqsMutation.mutate(editReqsText)}
                                            disabled={updateReqsMutation.isPending}
                                            className="px-4 py-2 text-sm font-bold text-white bg-brand-gradient hover:opacity-90 rounded-lg shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {updateReqsMutation.isPending ? 'Saving...' : 'Save Notes'}
                                        </button>
                                        <button
                                            onClick={() => setIsEditingReqs(false)}
                                            disabled={updateReqsMutation.isPending}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                booking.requirements ? (
                                    <p className="text-slate-700 whitespace-pre-wrap">{booking.requirements}</p>
                                ) : (
                                    <p className="text-slate-400 italic">No specific requirements provided.</p>
                                )
                            )}
                        </div>
                    </div>

                    {/* Travelers Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Travelers
                            </h2>
                            {!isReadOnly && !isMarketer && (
                                <button
                                    onClick={() => navigate(`/bookings/${id}/travelers`, { state: { returnUrl: `/bookings/${id}` } })}
                                    className="text-sm flex items-center gap-1.5 text-white bg-brand-gradient hover:opacity-90 font-bold px-4 py-2 rounded-lg shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <User size={14} /> Update Travelers
                                </button>
                            )}
                        </div>

                        {booking.travelers && booking.travelers.length > 0 ? (
                            <div className="space-y-5">
                                {/* Travel Details — shown once from primary traveler */}
                                {(() => {
                                    const traveler = booking.travelers[0];
                                    // For WordPress leads: the traveler may not have tripType/flight set,
                                    // but the booking-level fields DO have the correct values.
                                    const primary = {
                                        ...traveler,
                                        tripType: traveler.tripType || booking.tripType || 'one-way',
                                        flightFrom: traveler.flightFrom || booking.flightFrom || '',
                                        flightTo: traveler.flightTo || booking.flightTo || '',
                                    };
                                    const hasFlightInfo = primary.flightFrom || primary.flightTo;
                                    const hasTripInfo = primary.tripType || primary.country;

                                    if (!booking.includesFlight) return null;
                                    if (!hasFlightInfo && !hasTripInfo) return null;

                                    return (
                                        <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                                            <h3 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-1.5">
                                                <Plane size={15} className="text-secondary" /> Travel Details
                                            </h3>
                                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                                {/* Left Side: General Info */}
                                                <div className="space-y-2">
                                                    {primary.country && (
                                                        <div className="flex items-center space-x-2 text-sm text-secondary">
                                                            <MapPin size={14} className="text-secondary/60" />
                                                            <span className="font-medium">Destination:</span>
                                                            <span className="text-secondary/80">{primary.country}</span>
                                                        </div>
                                                    )}
                                                    {primary.tripType && (
                                                        <div className="flex items-center space-x-2 text-sm text-secondary">
                                                            <List size={14} className="text-secondary/60" />
                                                            <span className="font-medium">Trip Type:</span>
                                                            <span className="capitalize text-secondary/80">{primary.tripType}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Side: Flight Info (Standardized & Compact) */}
                                                {hasFlightInfo && (
                                                    <div className="lg:w-[320px] space-y-2">
                                                            {/* Consolidated Flight Card (Uniform for all types) */}
                                                            <div className="bg-white/80 p-2.5 rounded-lg border border-secondary/20 shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className="flex items-center gap-2 flex-1 justify-between">
                                                                        <span className="bg-secondary/10 text-secondary font-bold px-2 py-1 rounded-lg border border-secondary/20 text-[10px] shadow-sm min-w-[45px] text-center">{primary.flightFrom || 'TBD'}</span>
                                                                        <div className="flex flex-col items-center gap-0.5 relative px-2">
                                                                            <div className="flex items-center gap-1.5 justify-center w-full">
                                                                                {primary.tripType === 'round-trip' ? (
                                                                                    <ArrowLeftRight size={16} className="text-secondary/80" />
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <Plane size={14} className="text-secondary/60" />
                                                                                        <span className="text-secondary font-bold text-sm">→</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent"></div>
                                                                        </div>
                                                                        <span className="bg-secondary/10 text-secondary font-bold px-2 py-1 rounded-lg border border-secondary/20 text-[10px] shadow-sm min-w-[45px] text-center">{primary.flightTo || 'TBD'}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4 text-[10px] text-secondary border-t border-secondary/5 pt-2.5">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-[7px] font-bold text-secondary/30 uppercase tracking-widest">Departure</span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="opacity-50">🛫</span>
                                                                            <span className="font-bold text-secondary/70">{primary.departureTime ? dayjs(primary.departureTime).format('MMM DD, YYYY') : 'TBD'}</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {(primary.tripType === 'round-trip' || primary.arrivalTime) && (
                                                                        <div className="flex flex-col gap-0.5 text-right items-end">
                                                                            <span className="text-[7px] font-bold text-secondary/30 uppercase tracking-widest">{primary.tripType === 'round-trip' ? 'Return' : 'Arrival'}</span>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="font-bold text-secondary/70">
                                                                                    {primary.tripType === 'round-trip' 
                                                                                        ? (primary.returnDate || primary.returnDepartureTime ? dayjs(primary.returnDate || primary.returnDepartureTime).format('MMM DD, YYYY') : 'TBD')
                                                                                        : (primary.arrivalTime ? dayjs(primary.arrivalTime).format('MMM DD, YYYY') : 'TBD')}
                                                                                </span>
                                                                                <span className="opacity-50">🛬</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        {/* Multi-City Segments (Leg 2+) */}
                                                        {primary.tripType === 'multi-city' && booking.segments && booking.segments.length > 0 && (
                                                            <div className="space-y-2">
                                                                {booking.segments.map((segment: { from: string; to: string; date: string | null }, idx: number) => {
                                                                    if (idx === 0 && segment.from === primary.flightFrom && segment.to === primary.flightTo) return null;
                                                                    return (
                                                                        <div key={idx} className="bg-white/80 p-2.5 rounded-lg border border-secondary/20 shadow-sm hover:shadow-md transition-shadow">
                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                <div className="flex items-center gap-2 flex-1 justify-between">
                                                                                    <span className="bg-secondary/10 text-secondary font-bold px-2 py-1 rounded-lg border border-secondary/20 text-[10px] shadow-sm min-w-[45px] text-center">{segment.from || 'TBD'}</span>
                                                                                    <div className="flex flex-col items-center gap-0.5 px-2">
                                                                                        <div className="flex items-center gap-1.5 justify-center w-full">
                                                                                            <Plane size={14} className="text-secondary/60" />
                                                                                            <span className="text-secondary font-bold text-sm">→</span>
                                                                                        </div>
                                                                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent"></div>
                                                                                    </div>
                                                                                    <span className="bg-secondary/10 text-secondary font-bold px-2 py-1 rounded-lg border border-secondary/20 text-[10px] shadow-sm min-w-[45px] text-center">{segment.to || 'TBD'}</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-4 text-[10px] text-secondary border-t border-secondary/5 pt-2.5">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="opacity-50">🛫</span>
                                                                                    <span className="font-bold text-secondary/70">{segment.date ? dayjs(segment.date).format('MMM DD, YYYY') : 'TBD'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Additional Services Details */}
                                {booking.includesAdditionalServices && booking.additionalServicesDetails && (
                                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mt-4">
                                        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
                                            <List size={15} className="text-primary" /> Additional Services
                                        </h3>
                                        <div className="prose prose-sm text-slate-700 whitespace-pre-wrap">
                                            {booking.additionalServicesDetails}
                                        </div>
                                    </div>
                                )}

                                {/* Passenger Details */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                                        <User size={15} className="text-slate-400" /> Passengers ({booking.travelers?.length || 0})
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {booking.travelers.map((traveler: any, idx: number) => (
                                            <div key={traveler.id || idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                                <div className="flex items-center space-x-2 text-secondary font-medium mb-2">
                                                    <User size={16} />
                                                    <span>{traveler.name}</span>
                                                </div>
                                                <div className="space-y-1.5 text-sm text-slate-600">
                                                    {traveler.email && (
                                                        <div className="flex items-center space-x-2">
                                                            <Mail size={13} className="text-slate-400" />
                                                            <span>{traveler.email}</span>
                                                        </div>
                                                    )}
                                                    {traveler.phoneNumber && (
                                                        <div className="flex items-center space-x-2">
                                                            <Phone size={13} className="text-slate-400" />
                                                            <span>{traveler.phoneNumber}</span>
                                                        </div>
                                                    )}
                                                    {traveler.dob && (
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar size={13} className="text-slate-400" />
                                                            <span>DOB: {dayjs(traveler.dob).format('MMM DD, YYYY')}</span>
                                                        </div>
                                                    )}
                                                    {traveler.anniversary && (
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar size={13} className="text-slate-400" />
                                                            <span>Anniversary: {dayjs(traveler.anniversary).format('MMM DD, YYYY')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                                No travelers added yet.
                            </div>
                        )}
                    </div>

                    {/* Payments Section */}
                    {(booking.status === 'Booked' || (booking.payments && booking.payments.length > 0)) && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <CreditCard size={18} className="text-emerald-600" /> Payments ({booking.payments?.length || 0})
                                    {(() => {
                                        const totalAmount = booking.lumpSumAmount || booking.totalAmount || booking.amount || 0;
                                        const totalPaid = booking.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                                        const outstanding = totalAmount - totalPaid;
                                        return (
                                            <span className={`ml-4 px-2.5 py-1 text-[11px] font-bold uppercase tracking-tight rounded-lg border shadow-sm ${
                                                outstanding > 0 
                                                    ? 'bg-red-50 text-red-600 border-red-100/50' 
                                                    : outstanding < 0 
                                                        ? 'bg-purple-50 text-purple-600 border-purple-100/50'
                                                        : 'bg-blue-50 text-blue-600 border-blue-100/50'
                                            }`}>
                                                Outstanding: ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        );
                                    })()}
                                </span>
                                {!isReadOnly && !isMarketer && (
                                    <button
                                        onClick={() => setIsPaymentModalOpen(true)}
                                        className="text-sm flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium px-3 py-1.5 rounded-md transition-colors border border-emerald-200"
                                    >
                                        <Plus size={14} /> Add Payment
                                    </button>
                                )}
                            </h2>

                            {booking.payments && booking.payments.length > 0 ? (
                                <div className="space-y-3">
                                    {booking.payments.map((payment: any, idx: number) => (
                                        <div key={payment.id || idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-800 text-lg">{payment.amount.toFixed(2)}</span>
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-medium rounded">{payment.paymentMethod}</span>
                                                </div>
                                                <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                    <Calendar size={13} /> {dayjs(payment.date).format('MMM DD, YYYY')}
                                                    {payment.transactionId && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="font-mono text-xs">TXN: {payment.transactionId}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {payment.remarks && (
                                                    <p className="mt-2 text-sm text-slate-600 italic">"{payment.remarks}"</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                                    No payments recorded yet.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cost Analysis & Margins */}
                    {!isMarketer && (booking.estimatedCosts?.length > 0 || booking.actualCosts?.length > 0) && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <List size={18} className="text-slate-600" /> Cost Analysis & Margins
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Estimated Costs */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Estimated Costs</h3>
                                    {booking.estimatedCosts && booking.estimatedCosts.length > 0 ? (
                                        <div className="space-y-2">
                                            {booking.estimatedCosts.map((cost: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
                                                    <div>
                                                        <span className="font-medium text-slate-800">{cost.costType}</span>
                                                        {cost.source && <span className="text-slate-400 text-xs ml-2">({cost.source})</span>}
                                                    </div>
                                                    <span className="font-bold text-slate-700">{cost.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center text-sm p-2 bg-slate-100 rounded font-bold border-t border-slate-200">
                                                <span>Total Estimated</span>
                                                <span>{booking.estimatedCosts.reduce((sum: number, c: any) => sum + (c.price || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            {booking.estimatedMargin !== undefined && (
                                                <div className="flex justify-between items-center text-sm p-2 mt-2 bg-emerald-50 text-emerald-800 rounded font-bold border border-emerald-100">
                                                    <span>Estimated Margin</span>
                                                    <span>{booking.estimatedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No estimated costs recorded.</p>
                                    )}
                                </div>

                                {/* Actual Costs */}
                                {(user?.permissions?.canEditActualCost || user?.role === 'ADMIN') && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Actual Costs</h3>
                                        {booking.actualCosts && booking.actualCosts.length > 0 ? (
                                            <div className="space-y-2">
                                                {booking.actualCosts.map((cost: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-emerald-50/30 rounded border border-emerald-100">
                                                        <div>
                                                            <span className="font-medium text-slate-800">{cost.costType}</span>
                                                            {cost.source && <span className="text-slate-400 text-xs ml-2">({cost.source})</span>}
                                                        </div>
                                                        <span className="font-bold text-slate-700">{cost.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center text-sm p-2 bg-slate-100 rounded font-bold border-t border-slate-200">
                                                    <span>Total Actual</span>
                                                    <span>{booking.actualCosts.reduce((sum: number, c: any) => sum + (c.price || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                {booking.netMargin !== undefined && (
                                                    <div className="flex justify-between items-center text-sm p-2 mt-2 bg-blue-50 text-blue-800 rounded font-bold border border-blue-100">
                                                        <span>Net Margin</span>
                                                        <span>{booking.netMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No actual costs recorded.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Area */}
                <div className="space-y-6">
                    {/* Verification Status Card */}
                    {booking.status === 'Booked' && (user?.role === 'ADMIN' || user?.permissions?.canVerifyBookings || booking.verified) && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
                            <div className={`absolute top-0 left-0 w-1 h-full ${booking.verified ? 'bg-teal-500' : 'bg-slate-200'}`}></div>
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <ShieldCheck size={18} className={booking.verified ? 'text-teal-600' : 'text-slate-400'} />
                                Verification Status
                            </h2>
                            
                            {booking.verified ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-100 group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-1.5 bg-teal-500 rounded-full text-white shrink-0">
                                                <Check size={14} strokeWidth={4} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-teal-900 truncate">Verified</p>
                                                <p className="text-[10px] text-teal-700 uppercase font-medium tracking-tight">By {booking.verifiedBy?.name || 'Admin'}</p>
                                            </div>
                                        </div>
                                        
                                        {user?.role === 'ADMIN' && (
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to UNDO this verification?')) {
                                                        unverifyMutation.mutate();
                                                    }
                                                }}
                                                disabled={unverifyMutation.isPending}
                                                className="p-1.5 text-teal-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Undo Verification"
                                            >
                                                <RotateCcw size={14} className={unverifyMutation.isPending ? 'animate-spin' : ''} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {booking.status === 'Booked' && (user?.role === 'ADMIN' || user?.permissions?.canVerifyBookings) && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Verify this booking? This confirms that financial and traveler details are correct.')) {
                                                    verifyMutation.mutate();
                                                }
                                            }}
                                            disabled={verifyMutation.isPending}
                                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 disabled:opacity-50"
                                        >
                                            {verifyMutation.isPending ? (
                                                'Verifying...'
                                            ) : (
                                                <>
                                                    <ShieldCheck size={16} /> Verify Now
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Person</h2>
                            {!isReadOnly && (
                                <button
                                    onClick={() => setIsContactEditModalOpen(true)}
                                    className="text-slate-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-slate-50"
                                    title="Edit Lead Details"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 text-slate-700">
                                <User size={18} className="text-slate-400" />
                                <span className="font-medium">{booking.contactPerson}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-slate-700">
                                <Phone size={18} className="text-slate-400" />
                                <span>{booking.contactNumber}</span>
                            </div>
                            {booking.contactEmail && (
                                <div className="flex items-center space-x-3 text-slate-700">
                                    <Mail size={18} className="text-slate-400" />
                                    <span>{booking.contactEmail}</span>
                                </div>
                            )}
                            {booking.bookingType && (
                                <div className="flex items-center space-x-3 text-slate-700 pt-2 border-t border-slate-100">
                                    {booking.bookingType === 'B2B' ? (
                                        <Building2 size={18} className="text-secondary" />
                                    ) : (
                                        <UserCircle size={18} className="text-emerald-400" />
                                    )}
                                    <span className="font-medium">
                                        Source: <span className={booking.bookingType === 'B2B' ? 'text-secondary' : 'text-emerald-600'}>
                                            {booking.bookingType === 'B2B' ? 'Agent (B2B)' : 'Direct (B2C)'}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Assignment</h2>
                            <div className="flex items-center space-x-3 text-slate-700 mb-2">
                                <User size={18} className="text-primary" />
                                <span>{booking.assignedToUser?.name || <span className="italic text-slate-400">Unassigned</span>}</span>
                            </div>
                            {booking.assignedGroup && (
                                <div className="flex items-center space-x-3 text-slate-700">
                                    <Users size={18} className="text-secondary" />
                                    <span>Group: {booking.assignedGroup}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lead History Feed — merged comments + activities */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                            <span className="flex items-center">
                                <MessageSquare size={16} className="mr-2" />
                                Lead History
                            </span>
                            <button 
                                onClick={() => setIsCommentsModalOpen(true)}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-primary transition-all"
                                title="Fullscreen view"
                            >
                                <Maximize2 size={14} />
                            </button>
                        </h2>

                        <div className="mb-6">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a new comment or remark..."
                                className="w-full min-h-[80px] p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 transition-all"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => addCommentMutation.mutate(commentText)}
                                    disabled={!commentText.trim() || addCommentMutation.isPending}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-secondary/80 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {addCommentMutation.isPending ? (
                                        'Posting...'
                                    ) : (
                                        <>
                                            <Plus size={14} /> Post Comment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {(() => {
                                const timelineItems: any[] = [
                                    ...(booking.comments || []).map((c: any) => ({ ...c, _type: 'comment' })),
                                    ...(booking.activities || []).map((a: any) => ({ ...a, id: a.id || a._id, _type: 'activity' })),
                                ];
                                timelineItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                                if (timelineItems.length === 0) {
                                    return <p className="text-sm text-slate-400 italic">No activity yet.</p>;
                                }

                                return timelineItems.map((item) => {
                                    if (item._type === 'comment') {
                                        return (
                                            <div key={`c-${item.id}`} className="relative pl-4 border-l-2 border-secondary/20">
                                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-secondary/40"></div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-semibold text-slate-900">{item.createdBy?.name}</span>
                                                    <span className="text-[10px] text-slate-400 flex items-center">
                                                        <Clock size={10} className="mr-1" />
                                                        {dayjs(item.createdAt).format('MMM DD, h:mm A')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md">
                                                    {item.text}
                                                </p>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={`a-${item.id}`} className="relative pl-4 border-l-2 border-secondary/20">
                                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-secondary/40 flex items-center justify-center shadow-sm">
                                                    <ActivityIcon size={9} className="text-secondary" />
                                                </div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-semibold text-slate-900">
                                                        {item.action?.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 flex items-center">
                                                        <Clock size={10} className="mr-1" />
                                                        {dayjs(item.createdAt).format('MMM DD, h:mm A')}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                                                    <p>{item.details || item.action?.replace(/_/g, ' ')}</p>
                                                    <span className="block text-[10px] text-slate-400 mt-1 font-medium">system activity by {typeof item.userId === 'object' ? item.userId?.name : 'System'}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                });
                            })()}
                        </div>
                    </div>

                </div>
            </div>

            {booking && (
                <AddPaymentModal
                    booking={booking}
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                />
            )}
            {booking && (
                <EditModal
                    booking={booking}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onStatusChangeToBooked={() => {}}
                />
            )}
            {booking && (
                <ContactEditModal
                    booking={booking}
                    isOpen={isContactEditModalOpen}
                    onClose={() => setIsContactEditModalOpen(false)}
                />
            )}

            {/* Lead History Fullscreen Modal */}
            {isCommentsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Lead History</h2>
                                    <p className="text-xs text-slate-500 font-medium">Full timeline for {booking.contactPerson}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsCommentsModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Input inside modal for convenience */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a new comment or remark..."
                                    className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary bg-white transition-all resize-none shadow-sm"
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={() => addCommentMutation.mutate(commentText)}
                                        disabled={!commentText.trim() || addCommentMutation.isPending}
                                        className="px-5 py-2.5 text-xs font-bold text-white bg-secondary hover:bg-secondary/90 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider"
                                    >
                                        {addCommentMutation.isPending ? (
                                            'Posting...'
                                        ) : (
                                            <>
                                                <Plus size={16} /> Post Comment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Timeline</h3>
                                {(() => {
                                    const modalTimeline: any[] = [
                                        ...(booking.comments || []).map((c: any) => ({ ...c, _type: 'comment' })),
                                        ...(booking.activities || []).map((a: any) => ({ ...a, id: a.id || a._id, _type: 'activity' })),
                                    ];
                                    modalTimeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                                    if (modalTimeline.length === 0) {
                                        return (
                                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                                <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
                                                <p className="text-sm italic font-medium">No activity recorded yet.</p>
                                            </div>
                                        );
                                    }

                                    return modalTimeline.map((item) => {
                                        if (item._type === 'comment') {
                                            return (
                                                <div key={`mc-${item.id}`} className="relative pl-6 pb-2 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-secondary shadow-sm"></div>
                                                    <div className="bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-secondary uppercase">
                                                                    {item.createdBy?.name?.charAt(0) ?? '?'}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-800">{item.createdBy?.name}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-medium flex items-center bg-white px-2 py-1 rounded-md border border-slate-100">
                                                                <Clock size={10} className="mr-1.5" />
                                                                {dayjs(item.createdAt).format('MMM DD, YYYY • h:mm A')}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                            {item.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={`ma-${item.id}`} className="relative pl-6 pb-2 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-secondary/80 shadow-sm flex items-center justify-center">
                                                        <ActivityIcon size={8} className="text-white" />
                                                    </div>
                                                    <div className="bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                                                                    <ActivityIcon size={12} className="text-secondary" />
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-800">{item.action?.replace(/_/g, ' ')}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-medium flex items-center bg-white px-2 py-1 rounded-md border border-slate-100">
                                                                <Clock size={10} className="mr-1.5" />
                                                                {dayjs(item.createdAt).format('MMM DD, YYYY • h:mm A')}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed">
                                                            {item.details || item.action?.replace(/_/g, ' ')}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                                                            system activity by {typeof item.userId === 'object' ? item.userId?.name : 'System'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
