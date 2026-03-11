import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import dayjs from 'dayjs';
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, MessageSquare, Clock, Plane, Edit2, CreditCard, Plus, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddPaymentModal } from '../features/bookings/components/AddPaymentModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const BookingDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const { data: booking, isLoading } = useQuery({
        queryKey: ['booking', id],
        queryFn: async () => {
            const { data } = await api.get(`/bookings/${id}`);
            return data;
        },
        enabled: !!id,
    });

    const [isEditingReqs, setIsEditingReqs] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const navigate = useNavigate();
    const [editReqsText, setEditReqsText] = useState('');
    const { user } = useAuth();

    const queryClient = useQueryClient();

    const isAgent = user?.role === 'AGENT';
    const isAssignedToMe = booking?.assignedToUserId === user?.id;
    const isReadOnly = isAgent && !isAssignedToMe;

    const assignToMeMutation = useMutation({
        mutationFn: async () => {
            await api.put(`/bookings/${id}/assign`, {
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

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading booking details...</div>;
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

    const startEditingReqs = () => {
        setEditReqsText(booking.requirements || '');
        setIsEditingReqs(true);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/bookings" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Booking for {booking.contactPerson}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Created on {dayjs(booking.createdOn).format('MMM DD, YYYY h:mm A')} by {booking.createdByUser?.name}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-3 items-center">
                    {isReadOnly && (
                        <button
                            onClick={() => assignToMeMutation.mutate()}
                            disabled={assignToMeMutation.isPending}
                            className="text-sm flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
                        >
                            <UserPlus size={16} /> {assignToMeMutation.isPending ? 'Assigning...' : 'Assign To Me to Edit'}
                        </button>
                    )}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'Booked' ? 'bg-green-100 text-green-800' :
                        booking.status === 'Working' ? 'bg-purple-100 text-purple-800' :
                            booking.status === 'Sent' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                        }`}>
                        {booking.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${booking.interested === 'Yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {booking.interested === 'Yes' ? 'Interested' : 'Not Interested'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Requirements Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Detailed Requirements</h2>
                            {!isEditingReqs && !isReadOnly && (
                                <button
                                    onClick={startEditingReqs}
                                    className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
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
                                        className="w-full min-h-[150px] p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Enter detailed requirements..."
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateReqsMutation.mutate(editReqsText)}
                                            disabled={updateReqsMutation.isPending}
                                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
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
                            {!isReadOnly && (
                                <button
                                    onClick={() => navigate(`/bookings/${id}/travelers`)}
                                    className="text-sm flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 font-medium px-3 py-1.5 rounded-md transition-colors border border-indigo-200"
                                >
                                    <User size={14} /> Update Travelers
                                </button>
                            )}
                        </div>

                        {booking.travelers && booking.travelers.length > 0 ? (
                            <div className="space-y-5">
                                {/* Travel Details — shown once from primary traveler */}
                                {(() => {
                                    const primary = booking.travelers[0];
                                    const hasFlightInfo = primary.flightFrom || primary.flightTo;
                                    const hasTripInfo = primary.tripType || primary.country;

                                    if (!hasFlightInfo && !hasTripInfo) return null;

                                    return (
                                        <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100">
                                            <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-1.5">
                                                <Plane size={15} className="text-indigo-500" /> Travel Details
                                            </h3>
                                            <div className="space-y-3">
                                                {primary.country && (
                                                    <div className="flex items-center space-x-2 text-sm text-indigo-800">
                                                        <MapPin size={14} className="text-indigo-400" />
                                                        <span className="font-medium">Destination:</span>
                                                        <span>{primary.country}</span>
                                                    </div>
                                                )}
                                                {primary.tripType && (
                                                    <div className="flex items-center space-x-2 text-sm text-indigo-800">
                                                        <span className="font-medium">Trip Type:</span>
                                                        <span className="capitalize">{primary.tripType}</span>
                                                    </div>
                                                )}
                                                {hasFlightInfo && (
                                                    <div className="bg-white/80 p-3 rounded-md border border-indigo-100/70">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded text-xs border border-indigo-200">{primary.flightFrom || 'TBD'}</span>
                                                            <span className="text-indigo-400 text-lg">→</span>
                                                            <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded text-xs border border-indigo-200">{primary.flightTo || 'TBD'}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-indigo-800">
                                                            {primary.departureTime && (
                                                                <div>
                                                                    <span className="font-medium text-indigo-600/70">🛫 Departs:</span>{' '}
                                                                    {dayjs(primary.departureTime).format('MMM DD, h:mm A')}
                                                                </div>
                                                            )}
                                                            {primary.arrivalTime && (
                                                                <div>
                                                                    <span className="font-medium text-indigo-600/70">🛬 Arrives:</span>{' '}
                                                                    {dayjs(primary.arrivalTime).format('MMM DD, h:mm A')}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {primary.tripType === 'round-trip' && (primary.returnDepartureTime || primary.returnArrivalTime || primary.returnDate) && (
                                                            <div className="mt-3 pt-3 border-t border-indigo-100/70">
                                                                <p className="text-xs font-semibold text-amber-700 mb-2">Return Flight</p>
                                                                <div className="grid grid-cols-2 gap-2 text-xs text-indigo-800">
                                                                    {primary.returnDate && (
                                                                        <div>
                                                                            <span className="font-medium text-indigo-600/70">📅 Date:</span>{' '}
                                                                            {dayjs(primary.returnDate).format('MMM DD, YYYY')}
                                                                        </div>
                                                                    )}
                                                                    {primary.returnDepartureTime && (
                                                                        <div>
                                                                            <span className="font-medium text-indigo-600/70">🛫 Departs:</span>{' '}
                                                                            {dayjs(primary.returnDepartureTime).format('MMM DD, h:mm A')}
                                                                        </div>
                                                                    )}
                                                                    {primary.returnArrivalTime && (
                                                                        <div>
                                                                            <span className="font-medium text-indigo-600/70">🛬 Arrives:</span>{' '}
                                                                            {dayjs(primary.returnArrivalTime).format('MMM DD, h:mm A')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Passenger Details */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                                        <User size={15} className="text-slate-400" /> Passengers
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {booking.travelers.map((traveler: any, idx: number) => (
                                            <div key={traveler.id || idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                                <div className="flex items-center space-x-2 text-indigo-700 font-medium mb-2">
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
                                <span className="flex items-center gap-1.5"><CreditCard size={18} className="text-emerald-600" /> Payments ({booking.payments?.length || 0})</span>
                                {!isReadOnly && (
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
                                                    <span className="font-bold text-slate-800 text-lg">${payment.amount.toFixed(2)}</span>
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
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Contact Person</h2>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 text-slate-700">
                                <User size={18} className="text-slate-400" />
                                <span className="font-medium">{booking.contactPerson}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-slate-700">
                                <Phone size={18} className="text-slate-400" />
                                <span>{booking.contactNumber}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Assignment</h2>
                            <div className="flex items-center space-x-3 text-slate-700">
                                <User size={18} className="text-indigo-500" />
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

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {booking.comments && booking.comments.length > 0 ? (
                                booking.comments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((comment: any) => (
                                    <div key={comment.id} className="relative pl-4 border-l-2 border-indigo-100">
                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-400"></div>
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
        </div>
    );
};
