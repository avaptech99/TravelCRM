import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookingsTable } from '../features/bookings/components/BookingsTable';
import { Plus, Search, Filter } from 'lucide-react';
import { NewBookingModal } from '../features/bookings/components/NewBookingModal';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

const STATUS_OPTIONS = ['Pending', 'Working', 'Booked', 'Interested', 'Not Interested'];

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-blue-50 text-blue-700 border-blue-200 peer-checked:bg-blue-100 peer-checked:border-blue-500',
    Working: 'bg-purple-50 text-purple-700 border-purple-200 peer-checked:bg-purple-100 peer-checked:border-purple-500',
    Booked: 'bg-green-50 text-green-700 border-green-200 peer-checked:bg-green-100 peer-checked:border-green-500',
    Interested: 'bg-amber-50 text-amber-700 border-amber-200 peer-checked:bg-amber-100 peer-checked:border-amber-500',
    'Not Interested': 'bg-red-50 text-red-700 border-red-200 peer-checked:bg-red-100 peer-checked:border-red-500',
};

export const Bookings: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [searchParams, setSearchParams] = useSearchParams();

    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
    
    // Initialize state from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
        searchParams.get('status')?.split(',').filter(Boolean) || []
    );
    const [selectedAgents, setSelectedAgents] = useState<string[]>(
        searchParams.get('agent')?.split(',').filter(Boolean) || []
    );
    const [showFilters, setShowFilters] = useState(selectedStatuses.length > 0 || selectedAgents.length > 0);

    // Update URL params when filters change
    useEffect(() => {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.q = debouncedSearch;
        if (selectedStatuses.length > 0) params.status = selectedStatuses.join(',');
        if (selectedAgents.length > 0) params.agent = selectedAgents.join(',');
        
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, selectedStatuses, selectedAgents, setSearchParams]);

    const { data: agents } = useQuery({
        queryKey: ['agents'],
        queryFn: async () => {
            const { data } = await api.get('/users/agents');
            return data as { id: string; name: string }[];
        },
        enabled: isAdmin,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length === 0 || searchTerm.length >= 3) {
                setDebouncedSearch(searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const toggleAgent = (agentId: string) => {
        setSelectedAgents(prev =>
            prev.includes(agentId) ? prev.filter(a => a !== agentId) : [...prev, agentId]
        );
    };

    const activeFilterCount = selectedStatuses.length + selectedAgents.length;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">All Bookings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and track all customer travel bookings.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search contact person/number..."
                            className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block w-64 pl-10 p-2 shadow-sm transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            showFilters || activeFilterCount > 0
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Filter size={16} />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setIsNewBookingModalOpen(true)}
                        className="flex items-center space-x-2 bg-brand-gradient hover:opacity-90 text-white px-4 py-2 rounded-md shadow-md transition-all font-bold transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        <span>New Booking</span>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mx-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</h3>
                            {selectedStatuses.length > 0 && (
                                <button
                                    onClick={() => setSelectedStatuses([])}
                                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tight"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map(status => (
                                <label key={status} className="relative cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={selectedStatuses.includes(status)}
                                        onChange={() => toggleStatus(status)}
                                        className="peer sr-only"
                                    />
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${STATUS_COLORS[status]} group-hover:shadow-sm`}>
                                        {selectedStatuses.includes(status) && (
                                            <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {status}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {isAdmin && (
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agent</h3>
                                    {selectedAgents.length > 0 && (
                                        <button
                                            onClick={() => setSelectedAgents([])}
                                            className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tight"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <label className="relative cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedAgents.includes('unassigned')}
                                            onChange={() => toggleAgent('unassigned')}
                                            className="peer sr-only"
                                        />
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all bg-slate-50 text-slate-700 border-slate-200 peer-checked:bg-slate-200 peer-checked:border-slate-500 group-hover:shadow-sm">
                                            {selectedAgents.includes('unassigned') && (
                                                <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            Unassigned
                                        </span>
                                    </label>
                                    {agents?.filter(a => a.name !== 'Website Lead').map(agent => (
                                        <label key={agent.id} className="relative cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedAgents.includes(agent.id)}
                                                onChange={() => toggleAgent(agent.id)}
                                                className="peer sr-only"
                                            />
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all bg-white text-slate-700 border-slate-200 peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary group-hover:shadow-sm">
                                                {selectedAgents.includes(agent.id) && (
                                                    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                                {agent.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <BookingsTable
                searchTerm={debouncedSearch}
                statusFilter={selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined}
                agentFilter={selectedAgents.length > 0 ? selectedAgents.join(',') : undefined}
            />

            <NewBookingModal
                isOpen={isNewBookingModalOpen}
                onClose={() => setIsNewBookingModalOpen(false)}
            />
        </div>
    );
};
