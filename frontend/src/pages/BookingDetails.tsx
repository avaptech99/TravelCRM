import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import dayjs from 'dayjs';
import { User, Clock, CreditCard, MessageSquare, Plus, X, ShieldCheck, Check, Maximize2, Building2, UserCircle, UserPlus, Phone, Mail, Edit2, ArrowLeft } from 'lucide-react';
import { EditModal } from '../features/bookings/components/EditModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const BookingDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const { data: booking, isLoading, error } = useQuery<any, any>({
        queryKey: ['booking', id],
        queryFn: async ({ signal }) => {
            const { data } = await api.get(`/bookings/${id}`, { signal });
            return data;
        },
        enabled: !!id,
        retry: false, // Don't retry on 403
    });

    const [isEditingReqs, setIsEditingReqs] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

                    {/* Comments / Activity — large view */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-[500px]">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center">
                                <MessageSquare size={16} className="mr-2" />
                                Comments & Remarks
                            </div>
                            <button
                                onClick={() => setIsCommentsModalOpen(true)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                title="Expand Comments"
                            >
                                <Maximize2 size={16} />
                            </button>
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
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-semibold text-slate-900">{item.createdBy?.name || 'User'}</span>
                                                    <span className="text-[10px] text-slate-400 flex items-center shrink-0">
                                                        <Clock size={10} className="mr-1" />
                                                        {dayjs(item.createdAt).format('MMM DD, h:mm A')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md break-words whitespace-pre-wrap">
                                                    {item.text}
                                                </p>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={`activity-${item.id || item._id}`} className="relative pl-4 border-l-2 border-slate-200">
                                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                                <div className="flex justify-end mb-1">
                                                    <span className="text-[10px] text-slate-400 flex items-center shrink-0">
                                                        <Clock size={10} className="mr-1" />
                                                        {dayjs(item.createdAt).format('MMM DD, h:mm A')}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 bg-slate-100/50 p-2 rounded border border-slate-100 break-words whitespace-pre-wrap">
                                                    {item.details}
                                                </div>
                                            </div>
                                        );
                                    }
                                });
                            })()}
                        </div>
                    </div>

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
                            <div className="flex items-center space-x-3 text-slate-700">
                                <User size={18} className="text-primary" />
                                <span>{booking.assignedToUser?.name || <span className="italic text-slate-400">Unassigned</span>}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {booking && (
                <EditModal
                    booking={booking}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onStatusChangeToBooked={() => {}}
                />
            )}

            {/* Comments Modal */}
            {isCommentsModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={20} className="text-primary" />
                                <h2 className="text-lg font-bold text-slate-900">Comments & Activity History</h2>
                            </div>
                            <button 
                                onClick={() => setIsCommentsModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col p-6">
                            <div className="mb-6 shrink-0">
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a new comment or remark..."
                                    className="w-full min-h-[100px] p-4 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 transition-all resize-none shadow-inner"
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={() => addCommentMutation.mutate(commentText)}
                                        disabled={!commentText.trim() || addCommentMutation.isPending}
                                        className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {addCommentMutation.isPending ? (
                                            'Posting...'
                                        ) : (
                                            <>
                                                <Plus size={18} /> Post Comment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                                {(() => {
                                    const combined = [
                                        ...(booking.comments || []).map((c: any) => ({ ...c, type: 'comment' })),
                                        ...(booking.activities || []).map((a: any) => ({ ...a, type: 'activity' }))
                                    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                                    if (combined.length === 0) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                                <MessageSquare size={48} className="mb-4 opacity-20" />
                                                <p className="text-lg font-medium italic">No history yet.</p>
                                            </div>
                                        );
                                    }

                                    return combined.map((item: any) => {
                                        if (item.type === 'comment') {
                                            return (
                                                <div key={`modal-comment-${item.id || item._id}`} className="relative pl-6 border-l-2 border-primary/20">
                                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-primary/40"></div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                                                                {(item.createdBy?.name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            {item.createdBy?.name || 'User'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium flex items-center">
                                                            <Clock size={10} className="mr-1" />
                                                            {dayjs(item.createdAt).format('MMM DD, YYYY h:mm A')}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-700 bg-slate-50/50 p-4 rounded-xl break-words whitespace-pre-wrap font-medium border border-slate-100 shadow-sm">
                                                        {item.text}
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={`modal-activity-${item.id || item._id}`} className="relative pl-6 border-l-2 border-slate-200">
                                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-300"></div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Activity</span>
                                                        <span className="text-[10px] text-slate-400 font-medium flex items-center">
                                                            <Clock size={10} className="mr-1" />
                                                            {dayjs(item.createdAt).format('MMM DD, YYYY h:mm A')}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 break-words whitespace-pre-wrap italic">
                                                        {item.details}
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
