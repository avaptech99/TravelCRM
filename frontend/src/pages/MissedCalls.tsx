import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Phone, PhoneMissed, Search, CheckCircle, Clock, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'sonner';

dayjs.extend(relativeTime);

export const MissedCalls: React.FC = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const queryClient = useQueryClient();
    const limit = 10;

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['missed-calls', page, search],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (search) params.set('search', search);
            const res = await api.get(`/webhook/missed-calls?${params.toString()}`);
            return res.data;
        },
        refetchInterval: 30000, // Auto-refresh every 30 seconds
        refetchIntervalInBackground: true, // Keep polling even when tab is not focused
        staleTime: 0, // Always treat data as stale so refetchInterval fires a real request
    });

    const toggleReviewMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/webhook/missed-calls/${id}/review`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['missed-calls'] });
            toast.success('Status updated');
        },
        onError: () => {
            toast.error('Failed to update status');
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const missedCalls = data?.missedCalls || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    const getDispositionBadge = (disposition: string) => {
        const d = disposition.toUpperCase();
        if (d === 'NO ANSWER') return 'bg-red-100 text-red-700 border-red-200';
        if (d === 'BUSY') return 'bg-amber-100 text-amber-700 border-amber-200';
        if (d === 'FAILED') return 'bg-slate-100 text-slate-700 border-slate-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center py-20 min-h-[200px]">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 size={40} className="text-primary animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="px-2 border-b border-slate-200 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <PhoneMissed size={28} className="text-red-500" />
                        Missed Calls
                    </h1>
                    <p className="text-slate-500 text-sm mt-2">
                        Incoming calls from GDMS that were not answered. <span className="font-semibold text-slate-700">{pagination.total}</span> total records.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center space-x-2 bg-brand-gradient hover:opacity-90 text-white px-4 py-2 rounded-md shadow-md transition-all font-bold transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-2">
                <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by caller number or name..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        Search
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                            className="px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* Table */}
            <div className="px-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Caller</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Called</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviewed</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {missedCalls.map((call: any) => (
                                    <tr key={call._id} className={`hover:bg-slate-50 transition-colors ${call.isReviewed ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                                                    <PhoneMissed size={16} strokeWidth={2} className="text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{call.callerNumber}</p>
                                                    {call.callerName && call.callerName !== call.callerNumber && (
                                                        <p className="text-xs text-slate-400">{call.callerName}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {call.calledNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-slate-700">{dayjs(call.callTime).format('DD MMM YYYY')}</p>
                                            <p className="text-xs text-slate-400">{dayjs(call.callTime).format('hh:mm A')}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {call.duration}s
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getDispositionBadge(call.disposition)}`}>
                                                {call.disposition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => toggleReviewMutation.mutate(call._id)}
                                                disabled={toggleReviewMutation.isPending}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    call.isReviewed
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {call.isReviewed ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                {call.isReviewed ? 'Reviewed' : 'Pending'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {missedCalls.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100">
                                                    <PhoneMissed size={32} className="text-slate-300" />
                                                </div>
                                                <h3 className="text-slate-900 font-bold mb-1">No Missed Calls</h3>
                                                <p className="text-slate-400 text-sm">
                                                    {search ? 'No results match your search.' : 'No missed call records yet.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50/50">
                        {missedCalls.map((call: any) => (
                            <div key={call._id} className={`bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3 ${call.isReviewed ? 'opacity-60' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                                            <Phone size={18} className="text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800">{call.callerNumber}</h3>
                                            {call.callerName && call.callerName !== call.callerNumber && (
                                                <p className="text-xs text-slate-400">{call.callerName}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getDispositionBadge(call.disposition)}`}>
                                        {call.disposition}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>To: <span className="font-medium text-slate-700">{call.calledNumber}</span></span>
                                    <span>{dayjs(call.callTime).format('DD MMM hh:mm A')}</span>
                                    <span>{call.duration}s</span>
                                </div>
                                <button
                                    onClick={() => toggleReviewMutation.mutate(call._id)}
                                    disabled={toggleReviewMutation.isPending}
                                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                        call.isReviewed
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                                    }`}
                                >
                                    {call.isReviewed ? <CheckCircle size={14} /> : <Clock size={14} />}
                                    {call.isReviewed ? 'Reviewed' : 'Mark as Reviewed'}
                                </button>
                            </div>
                        ))}
                        {missedCalls.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                {search ? 'No results match your search.' : 'No missed call records yet.'}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-medium">
                                Page <span className="font-bold text-slate-700">{pagination.page}</span> of <span className="font-bold text-slate-700">{pagination.totalPages}</span>
                                <span className="ml-2 text-slate-400">({pagination.total} total)</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page >= pagination.totalPages}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
