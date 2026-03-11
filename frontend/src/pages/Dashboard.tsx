import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, CheckCircle, Clock, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { NewBookingModal } from '../features/bookings/components/NewBookingModal';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

    // Fetch some summary data for dashboard
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats', user?.id],
        queryFn: async () => {
            const [{ data: all }, { data: booked }, { data: newb }, { data: agentsData }] = await Promise.all([
                api.get('/bookings?limit=1'),
                api.get('/bookings?status=Booked&limit=1'),
                api.get('/bookings?status=Pending&limit=1'),
                api.get('/users/agents').catch(() => ({ data: [] })),
            ]);
            return {
                total: all.meta?.total || 0,
                booked: booked.meta?.total || 0,
                new: newb.meta?.total || 0,
                agents: agentsData?.length || 0,
            };
        },
    });

    const cards = [
        { title: 'Total Bookings', value: stats?.total || 0, icon: <FileText className="text-blue-600" size={22} />, bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' },
        { title: 'Confirmed (EDT)', value: stats?.booked || 0, icon: <CheckCircle className="text-emerald-600" size={22} />, bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' },
        { title: 'New Enquiries', value: stats?.new || 0, icon: <Clock className="text-amber-600" size={22} />, bg: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' },
    ];

    if (user?.role === 'ADMIN') {
        cards.push({ title: 'Active Agents', value: stats?.agents || 0, icon: <Users className="text-indigo-600" size={22} />, bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200' });
    }

    // Fetch latest 5 bookings for Activity feed
    const { data: recentBookings } = useQuery({
        queryKey: ['recent-bookings', user?.id],
        queryFn: async () => {
            const { data } = await api.get('/bookings?limit=5');
            return data.data;
        },
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="px-2 border-b border-slate-200 pb-5 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Overview Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-2">Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Here's a summary of your Travel CRM.</p>
                </div>
                <button
                    onClick={() => setIsNewBookingModalOpen(true)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors font-medium mt-1"
                >
                    <Plus size={18} />
                    <span>New Booking</span>
                </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                {cards.map((card, idx) => (
                    <div key={idx} className={`rounded-xl shadow-sm border p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 ${card.bg}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2.5 rounded-lg bg-white shadow-sm border border-white/50">
                                {card.icon}
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                            <h3 className="text-slate-600 text-sm font-medium mt-1">{card.title}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mx-2">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                        <p className="text-slate-500 text-xs mt-1">Latest 5 bookings logged in the system.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {recentBookings?.map((booking: any) => (
                                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                                        {booking.contactPerson}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'Booked' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {booking.assignedToUser?.name || 'Unassigned'}
                                    </td>
                                </tr>
                            ))}
                            {!recentBookings?.length && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                                        No recent bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <NewBookingModal
                isOpen={isNewBookingModalOpen}
                onClose={() => setIsNewBookingModalOpen(false)}
            />
        </div>
    );
};
