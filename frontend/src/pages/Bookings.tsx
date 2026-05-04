import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { BookingsTable } from '../features/bookings/components/BookingsTable';
import { Plus, Search, Filter, Users, UserSquare } from 'lucide-react';
import { NewBookingModal } from '../features/bookings/components/NewBookingModal';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { cn } from '../lib/utils';

const STATUS_OPTIONS = ['Pending', 'Working', 'Sent', 'Booked', 'Follow Up', 'Interested', 'Not Interested'];

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-blue-50 text-blue-700 border-blue-200 peer-checked:bg-blue-100 peer-checked:border-blue-500',
    Working: 'bg-purple-50 text-purple-700 border-purple-200 peer-checked:bg-purple-100 peer-checked:border-purple-500',
    Sent: 'bg-yellow-50 text-yellow-700 border-yellow-200 peer-checked:bg-yellow-100 peer-checked:border-yellow-500',
    Booked: 'bg-green-50 text-green-700 border-green-200 peer-checked:bg-green-100 peer-checked:border-green-500',
    Interested: 'bg-emerald-50 text-emerald-700 border-emerald-200 peer-checked:bg-emerald-100 peer-checked:border-emerald-500',
    'Not Interested': 'bg-slate-50 text-slate-700 border-slate-200 peer-checked:bg-slate-100 peer-checked:border-slate-500',
    'Follow Up': 'bg-[#efebe9] text-[#5d4037] border-[#d7ccc8] peer-checked:bg-[#d7ccc8] peer-checked:border-[#5d4037]',
};

export const Bookings: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isAdmin = user?.role === 'ADMIN';
    const [searchParams, setSearchParams] = useSearchParams();

    const isMyLeadsPath = location.pathname === '/mybooking';
    const isUnassignedPath = location.pathname === '/unassignedbooking';

    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
    
    // Initialize state from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
        searchParams.get('status')?.split(',').filter(Boolean) || []
    );
    const [selectedAgents, setSelectedAgents] = useState<string[]>(() => {
        const agents = searchParams.get('agent')?.split(',').filter(Boolean) || [];
        if (isUnassignedPath && !agents.includes('unassigned')) {
            return ['unassigned', ...agents];
        }
        return agents;
    });
    const [isOutstandingOnly, setIsOutstandingOnly] = useState(searchParams.get('outstanding') === 'true');
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(searchParams.get('group') || null);
    const [showFilters, setShowFilters] = useState(() => {
        const hasStatus = selectedStatuses.length > 0;
        const hasExtraAgents = isUnassignedPath 
            ? selectedAgents.filter(a => a !== 'unassigned').length > 0 
            : selectedAgents.length > 0;
        const hasOutstanding = searchParams.get('outstanding') === 'true';
        const hasGroup = !!searchParams.get('group');
        return hasStatus || hasExtraAgents || hasOutstanding || hasGroup;
    });

    // Update local state when URL params or path changes (e.g., from sidebar links)
    useEffect(() => {
        const q = searchParams.get('q') || '';
        const status = searchParams.get('status')?.split(',').filter(Boolean) || [];
        const agent = searchParams.get('agent')?.split(',').filter(Boolean) || [];
        const outstanding = searchParams.get('outstanding') === 'true';
        const group = searchParams.get('group') || null;

        if (isUnassignedPath && !agent.includes('unassigned')) {
            agent.push('unassigned');
        }

        setSearchTerm(q);
        setDebouncedSearch(q);
        setSelectedStatuses(status);
        setSelectedAgents(agent);
        setIsOutstandingOnly(outstanding);
        setSelectedDepartment(group);
    }, [searchParams, location.pathname]);

    // Update URL params only when state changes internally (via UI controls)
    const updateUrlParams = (newDebouncedSearch: string, newStatuses: string[], newAgents: string[], newOutstanding: boolean, newGroup: string | null) => {
        const params: Record<string, string> = {};
        if (newDebouncedSearch) params.q = newDebouncedSearch;
        if (newStatuses.length > 0) params.status = newStatuses.join(',');
        
        // Don't put 'unassigned' in query if we are on /unassignedbooking path
        const filteredAgents = isUnassignedPath ? newAgents.filter(a => a !== 'unassigned') : newAgents;
        if (filteredAgents.length > 0) params.agent = filteredAgents.join(',');
        
        if (newOutstanding) params.outstanding = 'true';
        if (newGroup) params.group = newGroup;
        if (isMyLeadsPath || searchParams.get('myBookings') === 'true') params.myBookings = 'true';
        
        setSearchParams(params, { replace: true });
    };

    // Replace the old useEffect with manual triggers or a more careful sync
    useEffect(() => {
        // Only sync to URL if the values actually changed from what's currently in the URL
        const currentQ = searchParams.get('q') || '';
        const currentStatus = searchParams.get('status') || '';
        const currentAgent = searchParams.get('agent') || '';
        const currentOutstanding = searchParams.get('outstanding') === 'true';
        const currentGroup = searchParams.get('group') || '';

        if (debouncedSearch !== currentQ || 
            selectedStatuses.join(',') !== currentStatus || 
            selectedAgents.join(',') !== currentAgent || 
            isOutstandingOnly !== currentOutstanding ||
            (selectedDepartment || '') !== currentGroup) {
            updateUrlParams(debouncedSearch, selectedStatuses, selectedAgents, isOutstandingOnly, selectedDepartment);
        }
    }, [debouncedSearch, selectedStatuses, selectedAgents, isOutstandingOnly, selectedDepartment]);

    const { data: agents } = useQuery({
        queryKey: ['agents'],
        queryFn: async () => {
            const { data } = await api.get('/users/agents');
            return data as { id: string; name: string; groups: string[] }[];
        },
        enabled: isAdmin,
    });

    const { data: dropdownSettings } = useQuery({
        queryKey: ['dropdown-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings/dropdowns');
            return data as Record<string, string[]>;
        },
        enabled: isAdmin,
    });


    const [isShowingAllAgents, setIsShowingAllAgents] = useState(false);

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

    const activeFilterCount = selectedStatuses.length + 
        (isUnassignedPath ? selectedAgents.filter(a => a !== 'unassigned').length : selectedAgents.length) + 
        (isOutstandingOnly ? 1 : 0) +
        (selectedDepartment ? 1 : 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div className="flex items-center gap-4">
                    {isMyLeadsPath || searchParams.get('myBookings') === 'true' ? (
                        <>
                            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                <UserSquare size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">My Leads</h1>
                                <p className="text-slate-500 text-sm">Manage and track your assigned travel leads.</p>
                            </div>
                        </>
                    ) : isUnassignedPath || searchParams.get('agent') === 'unassigned' ? (
                        <>
                            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                                <Users size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Unassigned Leads</h1>
                                <p className="text-slate-500 text-sm">Review and claim new unassigned travel leads.</p>
                            </div>
                        </>
                    ) : (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">All Bookings</h1>
                            <p className="text-slate-500 text-sm">Manage and track all customer travel bookings.</p>
                        </div>
                    )}
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
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Filter Options</h2>
                        </div>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => {
                                    setSelectedStatuses([]);
                                    setSelectedAgents([]);
                                    setIsOutstandingOnly(false);
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors uppercase tracking-tighter"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
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
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex flex-wrap gap-2 flex-1">
                                {STATUS_OPTIONS.filter(s => s !== 'Interested' && s !== 'Not Interested').map(status => (
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
                                <label className="relative cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isOutstandingOnly}
                                        onChange={() => setIsOutstandingOnly(!isOutstandingOnly)}
                                        className="peer sr-only"
                                    />
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        isOutstandingOnly 
                                            ? 'bg-red-100 text-red-700 border-red-500 shadow-sm' 
                                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                    } group-hover:shadow-sm`}>
                                        {isOutstandingOnly && (
                                            <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        Outstanding
                                    </span>
                                </label>
                            </div>

                            {/* Interest Tags Aligned Right */}
                            <div className="flex flex-wrap gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto md:ml-auto">
                                {STATUS_OPTIONS.filter(s => s === 'Interested' || s === 'Not Interested').map(status => (
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
                        </div>

                        {isAdmin && (
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</h3>
                                        {selectedDepartment && (
                                            <button
                                                onClick={() => {
                                                    setSelectedDepartment(null);
                                                    setIsShowingAllAgents(false);
                                                }}
                                                className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tight"
                                            >
                                                Clear Dept
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {dropdownSettings?.groups?.map(group => (
                                            <button
                                                key={group}
                                                onClick={() => {
                                                    setSelectedDepartment(group === selectedDepartment ? null : group);
                                                    setIsShowingAllAgents(false);
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                                    selectedDepartment === group 
                                                        ? "bg-primary text-white border-primary shadow-sm" 
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                                )}
                                            >
                                                {group}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {selectedDepartment ? `Agents in ${selectedDepartment}` : 'Agents'}
                                            </h3>
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isShowingAllAgents} 
                                                    onChange={(e) => setIsShowingAllAgents(e.target.checked)}
                                                    className="w-3 h-3 rounded text-primary focus:ring-primary/30"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Show All Agents</span>
                                            </label>
                                        </div>
                                        {selectedAgents.length > 0 && (
                                            <button
                                                onClick={() => setSelectedAgents([])}
                                                className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tight"
                                            >
                                                Clear Agents
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedDepartment || isShowingAllAgents) && (
                                            <>
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
                                                {agents?.filter(a => {
                                                    if (a.name === 'Website Lead') return false;
                                                    if (isShowingAllAgents) return true;
                                                    if (!selectedDepartment) return false; 
                                                    return a.groups?.some(g => g.toLowerCase().trim() === selectedDepartment.toLowerCase().trim());
                                                }).map(agent => (
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
                                            </>
                                        )}
                                        {!selectedDepartment && !isShowingAllAgents && (
                                            <p className="text-xs text-slate-400 italic py-1">Select a department to view agents...</p>
                                        )}
                                    </div>
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
                isMyBookingsView={isMyLeadsPath || searchParams.get('myBookings') === 'true'}
                outstandingFilter={isOutstandingOnly}
                groupFilter={selectedDepartment || undefined}
            />

            <NewBookingModal
                isOpen={isNewBookingModalOpen}
                onClose={() => setIsNewBookingModalOpen(false)}
            />
        </div>
    );
};
