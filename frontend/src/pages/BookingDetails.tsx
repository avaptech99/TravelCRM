import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import dayjs from 'dayjs';
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, MessageSquare, Clock, Plane, Edit2, CreditCard, Plus, UserPlus, Building2, UserCircle, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddPaymentModal } from '../features/bookings/components/AddPaymentModal';
import { EditModal } from '../features/bookings/components/EditModal';
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

    const updateFollowUpDateMutation = useMutation({
        mutationFn: async (followUpDate: string | null) => {
            await api.put(`/bookings/${id}`, { followUpDate });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            toast.success('Follow-up date saved');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to save follow-up date');
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
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                            Created on {dayjs(booking.createdAt).format('MMM DD, YYYY h:mm A')} by {booking.createdByUser?.name}
                        </p>
                        {booking.finalQuotation && (
                            <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 shadow-sm uppercase tracking-wider">
                                <CreditCard size={12} /> Final Quota: {booking.finalQuotation}
                            </span>
                        )}
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
                                        booking.status === 'Follow Up' ? 'bg-[#efebe9] text-[#5d4037] border-[#d7ccc8] focus:ring-[#5d4037]' :
                                            'bg-blue-100 text-blue-800 border-blue-200 focus:ring-blue-500'
                                }`}
                        >
                            <option value="Pending" className="bg-white text-slate-800">Pending</option>
                            <option value="Working" className="bg-white text-slate-800">Working</option>
                            <option value="Sent" className="bg-white text-slate-800">Sent</option>
                            <option value="Booked" className="bg-white text-slate-800">Booked</option>
                            <option value="Follow Up" className="bg-white text-slate-800">Follow Up</option>
                        </select>
                        {booking.status === 'Follow Up' && (
                            <input
                                type="date"
                                value={booking.followUpDate ? new Date(booking.followUpDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    updateFollowUpDateMutation.mutate(e.target.value || null);
                                }}
                                className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 cursor-pointer"
                                title="Follow-up date"
                            />
                        )}
                    ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'Booked' ? 'bg-green-100 text-green-800' :
                            booking.status === 'Working' ? 'bg-purple-100 text-purple-800' :
                                booking.status === 'Sent' ? 'bg-yellow-100 text-yellow-800' :
                                    booking.status === 'Follow Up' ? 'bg-[#efebe9] text-[#5d4037]' :
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
                                Travelers ({booking.travelers?.length || 0})
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
                                            <div className="space-y-3">
                                                {primary.country && (
                                                    <div className="flex items-center space-x-2 text-sm text-secondary">
                                                        <MapPin size={14} className="text-secondary/60" />
                                                        <span className="font-medium">Destination:</span>
                                                        <span>{primary.country}</span>
                                                    </div>
                                                )}
                                                {primary.tripType && (
                                                    <div className="flex items-center space-x-2 text-sm text-secondary">
                                                        <span className="font-medium">Trip Type:</span>
                                                        <span className="capitalize">{primary.tripType}</span>
                                                    </div>
                                                )}
                                                        {hasFlightInfo && (
                                                            <div className="space-y-4">
                                                                {/* Primary/Departure Flight */}
                                                                <div className="bg-white/80 p-3 rounded-md border border-secondary/20 shadow-sm transition-all hover:shadow-md">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="bg-secondary/20 text-secondary font-bold px-2.5 py-1 rounded text-xs border border-secondary/30">{primary.flightFrom || 'TBD'}</span>
                                                                            <span className="text-secondary/40 text-lg">→</span>
                                                                            <span className="bg-secondary/20 text-secondary font-bold px-2.5 py-1 rounded text-xs border border-secondary/30">{primary.flightTo || 'TBD'}</span>
                                                                        </div>
                                                                        {primary.tripType === 'multi-city' && (
                                                                            <span className="text-[10px] bg-secondary/10 text-secondary/60 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Leg 1</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs text-secondary">
                                                                        {primary.departureTime && (
                                                                            <div>
                                                                                <span className="font-medium text-secondary/70">🛫 Departs:</span>{' '}
                                                                                {dayjs(primary.departureTime).format('MMM DD, YYYY')}
                                                                            </div>
                                                                        )}
                                                                        {primary.arrivalTime && (
                                                                            <div>
                                                                                <span className="font-medium text-secondary/70">🛬 Arrives:</span>{' '}
                                                                                {dayjs(primary.arrivalTime).format('MMM DD, YYYY')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Multi-City Segments (Leg 2+) */}
                                                                {primary.tripType === 'multi-city' && booking.segments && booking.segments.length > 0 && (
                                                                    <div className="space-y-3 relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-secondary/5 pt-1">
                                                                        {booking.segments.map((segment: { from: string; to: string; date: string | null }, idx: number) => {
                                                                            // Skip leg 1 if it matches primary to avoid duplicate if captured that way
                                                                            if (idx === 0 && segment.from === primary.flightFrom && segment.to === primary.flightTo) return null;
                                                                            
                                                                            return (
                                                                                <div key={idx} className="bg-white/60 p-3 rounded-md border border-secondary/10 ml-6 relative">
                                                                                    {/* Connector dot */}
                                                                                    <div className="absolute -left-[27px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-secondary/20 border border-white"></div>
                                                                                    
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="bg-secondary/10 text-secondary font-medium px-2 py-0.5 rounded text-[11px]">{segment.from || 'TBD'}</span>
                                                                                            <span className="text-secondary/30 text-sm">→</span>
                                                                                            <span className="bg-secondary/10 text-secondary font-medium px-2 py-0.5 rounded text-[11px]">{segment.to || 'TBD'}</span>
                                                                                        </div>
                                                                                        <span className="text-[9px] text-secondary/40 font-bold uppercase tracking-wider">Leg {idx + 2}</span>
                                                                                    </div>
                                                                                    <div className="text-xs text-secondary">
                                                                                        {segment.date && (
                                                                                            <div>
                                                                                                <span className="font-medium text-secondary/60">📅 Date:</span>{' '}
                                                                                                {dayjs(segment.date).format('MMM DD, YYYY')}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* Return Flight (Round Trip) */}
                                                                {primary.tripType === 'round-trip' && (primary.returnDepartureTime || primary.returnArrivalTime || primary.returnDate) && (
                                                                    <div className="mt-4 pt-4 border-t border-secondary/20">
                                                                        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary/40"></span> Return Flight
                                                                        </p>
                                                                        <div className="bg-white/80 p-3 rounded-md border border-secondary/20">
                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                <span className="bg-secondary/20 text-secondary font-bold px-2.5 py-1 rounded text-xs border border-secondary/30">{primary.flightTo || 'TBD'}</span>
                                                                                <span className="text-secondary/40 text-lg">→</span>
                                                                                <span className="bg-secondary/20 text-secondary font-bold px-2.5 py-1 rounded text-xs border border-secondary/30">{primary.flightFrom || 'TBD'}</span>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2 text-xs text-secondary">
                                                                                {primary.returnDate && (
                                                                                    <div>
                                                                                        <span className="font-medium text-secondary/70">🛫 Departs:</span>{' '}
                                                                                        {dayjs(primary.returnDate).format('MMM DD, YYYY')}
                                                                                    </div>
                                                                                )}
                                                                                {primary.returnDepartureTime && !primary.returnDate && (
                                                                                    <div>
                                                                                        <span className="font-medium text-secondary/70">🛫 Departs:</span>{' '}
                                                                                        {dayjs(primary.returnDepartureTime).format('MMM DD, YYYY')}
                                                                                    </div>
                                                                                )}
                                                                                {primary.returnArrivalTime && (
                                                                                    <div>
                                                                                        <span className="font-medium text-secondary/70">🛬 Arrives:</span>{' '}
                                                                                        {dayjs(primary.returnArrivalTime).format('MMM DD, YYYY')}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
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
                                        <User size={15} className="text-slate-400" /> Passengers
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
                    {booking.status === 'Booked' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <CreditCard size={18} className="text-emerald-600" /> Payments ({booking.payments?.length || 0})
                                    {(() => {
                                        const totalAmount = booking.totalAmount || booking.amount || 0;
                                        const totalPaid = booking.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                                        const outstanding = totalAmount - totalPaid;
                                        return (
                                            <span className="ml-4 px-2.5 py-1 bg-red-50 text-red-600 text-sm font-medium rounded-md border border-red-100">
                                                Outstanding: {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                </div>

                {/* Sidebar Area */}
                <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Person</h2>
                            {!isReadOnly && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
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
                            <div className="flex items-center space-x-3 text-slate-700">
                                <User size={18} className="text-primary" />
                                <span>{booking.assignedToUser?.name || <span className="italic text-slate-400">Unassigned</span>}</span>
                            </div>
                        </div>
                    </div>

                    {/* Comments / Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                            <MessageSquare size={16} className="mr-2" />
                            Comments & Remarks
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
                            {booking.comments && booking.comments.length > 0 ? (
                                booking.comments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((comment: any) => (
                                    <div key={comment.id} className="relative pl-4 border-l-2 border-secondary/20">
                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-secondary/40"></div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-semibold text-slate-900">{comment.createdBy?.name}</span>
                                            <span className="text-[10px] text-slate-400 flex items-center">
                                                <Clock size={10} className="mr-1" />
                                                {dayjs(comment.createdAt).format('MMM DD, h:mm A')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md">
                                            {comment.text}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">No comments yet.</p>
                            )}
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
        </div>
    );
};
