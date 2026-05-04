import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import dayjs from 'dayjs';
import { Plane, Calendar, CreditCard, Plus, ArrowLeft, ArrowLeftRight, User, Phone, Mail, MapPin, MessageSquare, Clock, Edit2, UserPlus, Building2, UserCircle, List, Activity, CheckCircle2, ShieldCheck, Check, Layers } from 'lucide-react';
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
    const isAgentOfBooking = isAssignedToMe;
    
    // Marketers can only edit requirements if it's unassigned AND they created it (or admin/agent).
    // Now we refine this to follow the user's requirement: edit only if unassigned.
    const canEditReqs = !isReadOnly && (!isMarketer || (isMarketer && !assignedId));

    const isFinanceOps = user?.role === 'ADMIN' || 
                         user?.role === 'ACCOUNT' || 
                         user?.role === 'OPERATION' || 
                         (user?.groups || []).some(g => ['account', 'operation'].includes(g.toLowerCase().trim()));

    const canVerify = user?.role === 'ADMIN' || 
                      user?.role === 'ACCOUNT' || 
                      (user?.groups || []).some(g => g.toLowerCase().trim() === 'account');

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

    const verifyBookingMutation = useMutation({
        mutationFn: async (isVerified: boolean) => {
            await api.patch(`/bookings/${id}/verify`, { isVerified });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            toast.success('Verification status updated');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to verify booking');
        }
    });

    const updateCostsMutation = useMutation({
        mutationFn: async (data: { estimatedCosts?: any[], actualCosts?: any[], company?: string }) => {
            await api.put(`/bookings/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            toast.success('Costs updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update costs');
        }
    });

    const { data: dropdownSettings } = useQuery({
        queryKey: ['dropdown-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings/dropdowns');
            return data as Record<string, string[]>;
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
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                            Created on {dayjs(booking.createdAt).format('MMM DD, YYYY h:mm A')} by {booking.createdByUser?.name}
                        </p>
                        {booking.finalQuotation && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 shadow-sm uppercase tracking-wider">
                                    <CreditCard size={12} /> Final Quota: {booking.finalQuotation}
                                </span>
                                {booking.company && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100 shadow-sm uppercase tracking-wider">
                                        <Building2 size={12} /> {booking.company}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center pl-8 sm:pl-0 w-full sm:w-auto">
                    {isReadOnly && user?.role === 'AGENT' && (user?.groups || []).some(g => g.toLowerCase().trim() === (booking?.assignedGroup || 'Package / LCC').toLowerCase().trim()) && (
                        <button
                            onClick={() => assignToMeMutation.mutate()}
                            disabled={assignToMeMutation.isPending}
                            className="text-sm flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
                        >
                            <UserPlus size={16} /> {assignToMeMutation.isPending ? 'Assigning...' : 'Assign To Me to Edit'}
                        </button>
                    )}
                    {!isReadOnly && !isMarketer ? (
                        <>
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
                        </>
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
                    
                    <div className="flex-1" />

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

                {/* Main Content Area: Conditional Ordering based on User Department */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 1. Requirements Section (Always First) */}
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

                    {/* Define Sections and Render in Department-Specific Order */}
                    {(() => {
                        const financialsSection = (booking.status === 'Booked' || isFinanceOps) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <CostSection 
                                    title="Estimated Costs" 
                                    icon={<Clock size={18} />}
                                    color="blue"
                                    costs={booking.estimatedCosts || []}
                                    dropdownSettings={dropdownSettings}
                                    onSave={(newCosts) => updateCostsMutation.mutate({ estimatedCosts: newCosts })}
                                    isEditable={!isReadOnly && user?.role !== 'ACCOUNT'}
                                    isLoading={updateCostsMutation.isPending}
                                />
                                <CostSection 
                                    title="Actual Costs" 
                                    icon={<CheckCircle2 size={18} />}
                                    color="emerald"
                                    costs={booking.actualCosts || []}
                                    dropdownSettings={dropdownSettings}
                                    onSave={(newCosts) => updateCostsMutation.mutate({ actualCosts: newCosts })}
                                    isEditable={isFinanceOps}
                                    isLoading={updateCostsMutation.isPending}
                                    restrictedMessage={!isFinanceOps ? "Only Operation or Account team can edit Actual Costs" : undefined}
                                />
                            </div>
                        );

                        const travelersSection = (
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
                                        {(() => {
                                            const traveler = booking.travelers[0];
                                            const primary = {
                                                ...traveler,
                                                tripType: traveler.tripType || booking.tripType || 'one-way',
                                                flightFrom: traveler.flightFrom || booking.flightFrom || '',
                                                flightTo: traveler.flightTo || booking.flightTo || '',
                                            };
                                            const hasFlightInfo = primary.flightFrom || primary.flightTo;
                                            const hasTripInfo = primary.tripType || primary.country;

                                            if (!booking.includesFlight && !booking.includesAdditionalServices) return null;

                                            return (
                                                <div className="space-y-4">
                                                    {booking.includesFlight && (hasFlightInfo || hasTripInfo) && (
                                                        <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                                                            <h3 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-1.5">
                                                                <Plane size={15} className="text-secondary" /> Flight Details
                                                            </h3>
                                                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
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
                                                                {hasFlightInfo && (
                                                                    <div className="lg:w-[320px] space-y-2">
                                                                        <div className="bg-white/80 p-2.5 rounded-lg border border-secondary/20 shadow-sm">
                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                <div className="flex items-center gap-2 flex-1 justify-between">
                                                                                    <span className="bg-secondary/10 text-secondary font-bold px-2 py-1 rounded-lg border border-secondary/20 text-[10px] min-w-[45px] text-center">{primary.flightFrom || 'TBD'}</span>
                                                                                    <div className="flex flex-col items-center gap-0.5 relative px-2">
                                                                                        <div className="flex items-center gap-1.5 justify-center w-full">
                                                                                            {primary.tripType === 'round-trip' ? <ArrowLeftRight size={16} className="text-secondary/80" /> : <Plane size={14} className="text-secondary/60" />}
                                                                                        </div>
                                                                                        <div className="w-full h-px bg-secondary/20"></div>
                                                                                    </div>
                                                                                    <span className="bg-secondary/10 text-secondary font-bold px-2 py-1 rounded-lg border border-secondary/20 text-[10px] min-w-[45px] text-center">{primary.flightTo || 'TBD'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {booking.includesAdditionalServices && booking.additionalServicesDetails && (
                                                        <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                                                            <h3 className="text-sm font-semibold text-secondary mb-2 flex items-center gap-1.5">
                                                                <Layers size={15} className="text-secondary/80" /> Additional Services
                                                            </h3>
                                                            <div className="text-sm text-secondary/90 whitespace-pre-wrap font-medium pl-6">
                                                                {booking.additionalServicesDetails}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                                                <User size={15} className="text-slate-400" /> Passengers
                                            </h3>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {booking.travelers.map((traveler: any, idx: number) => (
                                                    <div key={traveler.id || idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                                        <div className="flex items-center space-x-2 text-secondary font-medium mb-2">
                                                            <User size={16} /> <span>{traveler.name}</span>
                                                        </div>
                                                        <div className="space-y-1.5 text-sm text-slate-600">
                                                            {traveler.phoneNumber && <div className="flex items-center space-x-2"><Phone size={13} className="text-slate-400" /><span>{traveler.phoneNumber}</span></div>}
                                                            {traveler.dob && <div className="flex items-center space-x-2"><Calendar size={13} className="text-slate-400" /><span>DOB: {dayjs(traveler.dob).format('MMM DD, YYYY')}</span></div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">No travelers added yet.</div>
                                )}
                            </div>
                        );

                        const paymentsSection = (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <CreditCard size={18} className="text-emerald-600" /> Payments ({booking.payments?.length || 0})
                                        {(() => {
                                            const totalAmount = booking.totalAmount || booking.amount || 0;
                                            const totalPaid = booking.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                                            const outstanding = totalAmount - totalPaid;
                                            return <span className="ml-4 px-2.5 py-1 bg-red-50 text-red-600 text-sm font-medium rounded-md border border-red-100">Outstanding: {outstanding.toLocaleString()}</span>;
                                        })()}
                                    </span>
                                    {!isReadOnly && !isMarketer && (isFinanceOps || isAgentOfBooking) && (
                                        <button onClick={() => setIsPaymentModalOpen(true)} className="text-sm flex items-center gap-1 text-emerald-700 bg-emerald-50 font-medium px-3 py-1.5 rounded-md border border-emerald-200"><Plus size={14} /> Add Payment</button>
                                    )}
                                </h2>
                                {booking.payments && booking.payments.length > 0 ? (
                                    <div className="space-y-3">
                                        {booking.payments.map((payment: any, idx: number) => (
                                            <div key={payment.id || idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1"><span className="font-bold text-slate-800 text-lg">{payment.amount.toFixed(2)}</span><span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-medium rounded">{payment.paymentMethod}</span></div>
                                                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1"><Calendar size={13} /> {dayjs(payment.date).format('MMM DD, YYYY')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">No payments recorded yet.</div>
                                )}
                            </div>
                        );

                        return isFinanceOps ? (
                            <div className="space-y-6">
                                {financialsSection}
                                {paymentsSection}
                                {travelersSection}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {travelersSection}
                                {paymentsSection}
                                {financialsSection}
                            </div>
                        );
                    })()}

                </div>

                {/* Sidebar Area */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Verification Status Card */}
                    {booking.status === 'Booked' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
                                <ShieldCheck size={18} className="text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Verification Status</h3>
                            </div>
                            
                            <div className="p-5">
                                {booking.isVerified ? (
                                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex items-center gap-4 w-full">
                                        <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg shadow-emerald-200 shrink-0">
                                            <Check size={20} strokeWidth={3} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-black text-emerald-900 leading-none mb-1">Verified</p>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest truncate">
                                                    By {booking.verifiedBy || 'Authorized Auditor'}
                                                </p>
                                                {canVerify && (
                                                    <button 
                                                        onClick={() => verifyBookingMutation.mutate(false)}
                                                        className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase underline decoration-dotted transition-colors shrink-0"
                                                    >
                                                        Undo
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    canVerify ? (
                                        <button
                                            onClick={() => verifyBookingMutation.mutate(true)}
                                            disabled={verifyBookingMutation.isPending}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            {verifyBookingMutation.isPending ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={18} />
                                                    <span>Verify Now</span>
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 border-dashed text-center">
                                            <p className="text-xs font-medium text-slate-500">Pending Financial Audit</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

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
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3 text-slate-700">
                                    <User size={18} className="text-primary" />
                                    <span>{booking.assignedToUser?.name || <span className="italic text-slate-400">Unassigned</span>}</span>
                                </div>
                                
                                <div className="flex items-center space-x-3 text-slate-700">
                                    <Layers size={18} className="text-slate-400" />
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Assigned Group</p>
                                        <span className="text-sm font-medium">{booking.assignedGroup || <span className="italic text-slate-300">Not assigned</span>}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments / Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col max-h-[600px]">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center shrink-0">
                            <MessageSquare size={16} className="mr-2" />
                            Comments & Remarks
                        </h2>

                        <div className="mb-4 shrink-0">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a new comment or remark..."
                                className="w-full min-h-[80px] p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 transition-all resize-y"
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

                        <div className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-[200px]">
                            {(() => {
                                const combined = [
                                    ...(booking.comments || []).map((c: any) => ({ ...c, type: 'comment' })),
                                    ...(booking.activities || []).map((a: any) => ({ ...a, type: 'activity' }))
                                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                                if (combined.length === 0) {
                                    return <p className="text-sm text-slate-400 italic">No history yet.</p>;
                                }

                                return combined.map((item: any) => {
                                    if (item.type === 'comment') {
                                        return (
                                            <div key={`comment-${item.id || item._id}`} className="relative pl-4 border-l-2 border-secondary/20">
                                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-secondary/40"></div>
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{item.createdBy?.name || 'User'}</span>
                                                    <span className="text-[10px] text-slate-400 flex items-center shrink-0">
                                                        <Clock size={10} className="mr-1" />
                                                        {dayjs(item.createdAt).format('MMM DD, h:mm A')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md break-words whitespace-pre-wrap">
                                                    {item.text}
                                                </p>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={`activity-${item.id || item._id}`} className="relative pl-4 border-l-2 border-slate-200">
                                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1 min-w-0">
                                                        <Activity size={10} className="shrink-0" /> <span className="truncate">{item.action.replace(/_/g, ' ')}</span>
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 flex items-center shrink-0">
                                                        <Clock size={10} className="mr-1" />
                                                        {dayjs(item.createdAt).format('MMM DD, h:mm A')}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 bg-slate-100/50 p-2 rounded border border-slate-100 break-words whitespace-pre-wrap">
                                                    <span className="font-medium">{item.userId?.name || 'System'}</span>: {item.details}
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
        </div>
    );
};

interface CostSectionProps {
    title: string;
    icon: React.ReactNode;
    color: 'blue' | 'emerald';
    costs: any[];
    dropdownSettings?: Record<string, string[]>;
    onSave: (costs: any[]) => void;
    isEditable: boolean;
    isLoading: boolean;
    restrictedMessage?: string;
}

const CostSection: React.FC<CostSectionProps> = ({ title, icon, color, costs, dropdownSettings, onSave, isEditable, isLoading, restrictedMessage }) => {
    const [localCosts, setLocalCosts] = React.useState(costs);


    React.useEffect(() => {
        setLocalCosts(costs);
    }, [costs]);

    const toggleCostType = (type: string) => {
        const isActive = localCosts.some(c => c.costType === type);
        if (isActive) {
            setLocalCosts(localCosts.filter(c => c.costType !== type));
        } else {
            setLocalCosts([...localCosts, { costType: type, price: 0, source: dropdownSettings?.costSources?.[0] || 'Direct Vendor' }]);
        }
    };

    const handleChange = (idx: number, field: string, value: any) => {
        const newCosts = [...localCosts];
        newCosts[idx] = { ...newCosts[idx], [field]: value };
        setLocalCosts(newCosts);
    };

    const total = localCosts.reduce((sum, c) => sum + (Number(c.price) || 0), 0);

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full`}>
            <div className={`p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-${color}-100 text-${color}-600`}>
                        {icon}
                    </div>
                    <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
                </div>
                <span className={`px-2 py-1 bg-${color}-50 text-${color}-700 text-xs font-black rounded-lg border border-${color}-100`}>
                    Total: {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>

            <div className="p-4 flex-1 flex flex-col min-h-0">
                {isEditable ? (
                    <div className="flex flex-col h-full space-y-4">
                        <div className="shrink-0">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Cost Types</label>
                            <div className="flex flex-wrap gap-1.5">
                                {(dropdownSettings?.costTypes || []).map(type => {
                                    const isActive = localCosts.some(c => c.costType === type);
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => toggleCostType(type)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                                                isActive
                                                ? `bg-${color}-600 border-${color}-600 text-white shadow-sm`
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[100px]">
                            {localCosts.length > 0 ? (
                                localCosts.map((cost, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border border-${color}-100 bg-${color}-50/30 space-y-2`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black text-${color}-600 uppercase`}>{cost.costType}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Price</label>
                                                <input 
                                                    type="number"
                                                    className="w-full p-2 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                                                    value={cost.price || ''}
                                                    onChange={(e) => handleChange(idx, 'price', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Source</label>
                                                <select 
                                                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                                                    value={cost.source}
                                                    onChange={(e) => handleChange(idx, 'source', e.target.value)}
                                                >
                                                    {dropdownSettings?.costSources?.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-xs text-slate-400 italic">Select cost types above to start tracking</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => onSave(localCosts)}
                            disabled={isLoading || JSON.stringify(localCosts) === JSON.stringify(costs)}
                            className={`w-full py-2.5 rounded-xl text-white font-black text-xs bg-${color}-600 hover:bg-${color}-700 shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none shrink-0`}
                        >
                            {isLoading ? 'Saving...' : 'Update Records'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {restrictedMessage && (
                            <p className="text-[10px] text-slate-400 italic mb-2 flex items-center gap-1">
                                <Clock size={10} /> {restrictedMessage}
                            </p>
                        )}
                        {localCosts.length > 0 ? (
                            localCosts.map((cost, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full bg-${color}-400`}></div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-700">{cost.costType}</span>
                                            <p className="text-[10px] text-slate-400 font-medium">Source: {cost.source}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">
                                        {Number(cost.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                                No {title.toLowerCase()} recorded.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

