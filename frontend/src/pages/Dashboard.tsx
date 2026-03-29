import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, CheckCircle, Clock, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { NewBookingModal } from '../features/bookings/components/NewBookingModal';
import { Loader2 } from 'lucide-react';
import { useGlobalSync } from '../hooks/useGlobalSync';

const Loader: React.FC<{ fullPage?: boolean }> = ({ fullPage = false }) => {
    const content = (
        <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                <Loader2 size={40} className="text-primary animate-spin relative z-10" />
            </div>
        </div>
    );
    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                {content}
            </div>
        );
    }
    return (
        <div className="w-full flex items-center justify-center py-20 min-h-[200px]">
            {content}
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

    // Single combined call for stats + recent bookings + notifications
    const { data: syncData, isLoading: isStatsLoading, isError, error, refetch } = useGlobalSync();

    const stats = syncData?.stats;
    const recentBookings = syncData?.recentBookings;
    const notifications = syncData?.notifications;

    const cards = [
        { title: 'Total Bookings', value: stats?.total || 0, icon: <FileText className="text-blue-600" size={22} />, bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' },
        { title: 'Confirmed (EDT)', value: stats?.booked || 0, icon: <CheckCircle className="text-emerald-600" size={22} />, bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' },
        { title: 'New Enquiries', value: stats?.pending || 0, icon: <Clock className="text-amber-600" size={22} />, bg: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' },
    ];

    if (user?.role === 'ADMIN') {
        cards.push({ title: 'Active Agents', value: stats?.agents || 0, icon: <Users className="text-secondary" size={22} />, bg: 'bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20' });
    }

    if (isStatsLoading) {
        return <Loader fullPage />;
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm w-full text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
                        <WifiOff className="text-amber-500" size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Connection Issue</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Unable to reach the server. It may be restarting — this usually takes 15-30 seconds.
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-sm"
                    >
                        <RefreshCw size={14} />
                        Retry
                    </button>
                    {error && (
                        <p className="text-[10px] text-slate-400 font-mono">{(error as Error).message}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="px-2 border-b border-slate-200 pb-5 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
                    <p className="text-slate-500 text-sm mt-2">Welcome, <span className="font-semibold text-slate-700">{user?.name}</span>. Here's a summary of your Bookings.</p>
                </div>
                <button
                    onClick={() => setIsNewBookingModalOpen(true)}
                    className="flex items-center space-x-2 bg-brand-gradient hover:opacity-90 text-white px-4 py-2 rounded-md shadow-md transition-all font-bold mt-1 transform hover:scale-[1.02] active:scale-[0.98]"
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2 pb-10">
                {/* Recent Activity Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Clock size={18} className="text-primary" />
                            Recent Activity
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">Latest 5 bookings logged in the system.</p>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Assigned</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {recentBookings?.map((booking: any) => (
                                    <tr key={booking.id || booking._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                                            {booking.contactPerson}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-tight ${
                                                booking.status === 'Booked' ? 'bg-emerald-100 text-emerald-700' :
                                                booking.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right font-medium">
                                            {booking.assignedToUser?.name?.split(' ')[0] || 'Unassigned'}
                                        </td>
                                    </tr>
                                ))}
                                {!recentBookings?.length && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            No recent bookings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Notifications Log */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <div className="relative">
                                    <FileText size={18} className="text-secondary" />
                                    {notifications?.some((n: any) => !n.read) && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                    )}
                                </div>
                                Notification Logs
                            </h2>
                            <p className="text-slate-500 text-xs mt-1">System updates and important alerts.</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar p-1">
                        {notifications && notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {notifications.slice(0, 10).map((note: any) => (
                                    <div key={note.id || note._id} className={`p-4 hover:bg-slate-50 transition-all flex gap-3 ${!note.read ? 'bg-blue-50/30' : ''}`}>
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!note.read ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-relaxed ${!note.read ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>
                                                {note.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Clock size={10} /> {new Date(note.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(note.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100 shadow-sm">
                                    <FileText size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold mb-1">No Notifications</h3>
                                <p className="text-slate-400 text-sm max-w-[200px]">You're all caught up! No recent system logs found.</p>
                            </div>
                        )}
                    </div>
                    {(notifications?.length ?? 0) > 10 && (
                        <div className="p-4 border-t border-slate-50 text-center">
                            <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">
                                View All Activity
                            </button>
                        </div>
                    )}
                </div>
            </div>


            <NewBookingModal
                isOpen={isNewBookingModalOpen}
                onClose={() => setIsNewBookingModalOpen(false)}
            />
        </div>
    );
};
