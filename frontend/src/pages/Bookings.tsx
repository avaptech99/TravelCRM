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
    const isAllLeadsPath = location.pathname === '/bookings';

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

    // Replace the old competing useEffects with a single direct update pattern
    const updateUrlParams = (newParams: { q?: string, status?: string[], agent?: string[], outstanding?: boolean, group?: string | null }) => {
        const nextParams = new URLSearchParams(searchParams);
        
        if (newParams.q !== undefined) {
            if (newParams.q) nextParams.set('q', newParams.q);
            else nextParams.delete('q');
        }
        
        if (newParams.status !== undefined) {
            if (newParams.status.length > 0) nextParams.set('status', newParams.status.join(','));
            else nextParams.delete('status');
        }
        
        if (newParams.agent !== undefined) {
            const filteredAgents = isUnassignedPath ? newParams.agent.filter(a => a !== 'unassigned') : newParams.agent;
            if (filteredAgents.length > 0) nextParams.set('agent', filteredAgents.join(','));
            else nextParams.delete('agent');
        }
        
        if (newParams.outstanding !== undefined) {
            if (newParams.outstanding) nextParams.set('outstanding', 'true');
            else nextParams.delete('outstanding');
        }
        
        if (newParams.group !== undefined) {
            if (newParams.group) nextParams.set('group', newParams.group);
            else nextParams.delete('group');
        }

        if (isMyLeadsPath) nextParams.set('myBookings', 'true');
        
        setSearchParams(nextParams, { replace: true });
    };

    // Update local state when URL changes (Sync Down)
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
    }, [searchParams.toString(), isUnassignedPath]); 

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
        const next = selectedStatuses.includes(status) 
            ? selectedStatuses.filter(s => s !== status) 
            : [...selectedStatuses, status];
        updateUrlParams({ status: next });
    };

    const toggleAgent = (agentId: string) => {
        const next = selectedAgents.includes(agentId) 
            ? selectedAgents.filter(a => a !== agentId) 
            : [...selectedAgents, agentId];
        updateUrlParams({ agent: next });
    };

    const activeFilterCount = selectedStatuses.length + 
        (isUnassignedPath ? selectedAgents.filter(a => a !== 'unassigned').length : selectedAgents.length) + 
        (isOutstandingOnly ? 1 : 0) +
        (selectedDepartment ? 1 : 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0 px-2">
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
                        onClick={() => !isAllLeadsPath && setShowFilters(!showFilters)}
                        disabled={isAllLeadsPath}
                        title={isAllLeadsPath ? 'Filters are disabled on the All Leads view' : undefined}
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            isAllLeadsPath
                                ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                                : showFilters || activeFilterCount > 0
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
            {showFilters && !isAllLeadsPath && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 mx-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Filter size={12} className="text-slate-400" />
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter Options</h2>
                        </div>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => {
                                    updateUrlParams({ 
                                        status: [], 
                                        agent: [], 
                                        outstanding: false, 
                                        group: null 
                                    });
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded transition-colors uppercase tracking-tight"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-20 pt-1.5 shrink-0">
                            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status</h3>
                        </div>
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                            {STATUS_OPTIONS.filter(s => s !== 'Interested' && s !== 'Not Interested').map(status => (
                                <label key={status} className="relative cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={selectedStatuses.includes(status)}
                                        onChange={() => toggleStatus(status)}
                                        className="peer sr-only"
                                    />
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${STATUS_COLORS[status]} group-hover:shadow-sm`}>
                                        {selectedStatuses.includes(status) && (
                                            <svg className="w-2.5 h-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                                    onChange={() => updateUrlParams({ outstanding: !isOutstandingOnly })}
                                    className="peer sr-only"
                                />
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                                    isOutstandingOnly 
                                        ? 'bg-red-100 text-red-700 border-red-500 shadow-sm' 
                                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                } group-hover:shadow-sm`}>
                                    {isOutstandingOnly && (
                                        <svg className="w-2.5 h-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    Outstanding
                                </span>
                            </label>

                            <div className="h-4 w-px bg-slate-100 mx-1 hidden md:block" />

                            {STATUS_OPTIONS.filter(s => s === 'Interested' || s === 'Not Interested').map(status => (
                                <label key={status} className="relative cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={selectedStatuses.includes(status)}
                                        onChange={() => toggleStatus(status)}
                                        className="peer sr-only"
                                    />
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${STATUS_COLORS[status]} group-hover:shadow-sm`}>
                                        {selectedStatuses.includes(status) && (
                                            <svg className="w-2.5 h-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                            <div className="pt-2 border-t border-slate-50 space-y-2">
                                <div className="flex items-start gap-4">
                                    <div className="w-20 pt-1.5 shrink-0">
                                        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dept</h3>
                                    </div>
                                    <div className="flex-1 flex flex-wrap gap-1.5">
                                        {dropdownSettings?.groups?.map(group => (
                                            <button
                                                key={group}
                                                onClick={() => {
                                                    const nextGroup = group === selectedDepartment ? null : group;
                                                    updateUrlParams({ group: nextGroup });
                                                    setIsShowingAllAgents(false);
                                                }}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
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

                                <div className="flex items-start gap-4">
                                    <div className="w-20 pt-1.5 shrink-0">
                                        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Agents</h3>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {(selectedDepartment || isShowingAllAgents) && (
                                                <>
                                                    <label className="relative cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAgents.includes('unassigned')}
                                                            onChange={() => toggleAgent('unassigned')}
                                                            className="peer sr-only"
                                                        />
                                                        <span className={cn(
                                                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all uppercase tracking-tighter",
                                                            selectedAgents.includes('unassigned')
                                                                ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                                                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                                        )}>
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
                                                            <span className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all uppercase tracking-tighter",
                                                                selectedAgents.includes(agent.id)
                                                                    ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                                                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                                            )}>
                                                                {agent.name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </>
                                            )}
                                            {!selectedDepartment && !isShowingAllAgents && (
                                                <p className="text-[10px] text-slate-400 italic py-1">Select a department...</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isShowingAllAgents} 
                                                    onChange={(e) => setIsShowingAllAgents(e.target.checked)}
                                                    className="w-3 h-3 rounded text-primary focus:ring-primary/30"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">All Agents</span>
                                            </label>
                                            {selectedAgents.length > 0 && (
                                                <button
                                                    onClick={() => updateUrlParams({ agent: [] })}
                                                    className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-tight"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
            )}

            <BookingsTable
                searchTerm={debouncedSearch}
                statusFilter={selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined}
                agentFilter={selectedAgents.length > 0 ? selectedAgents.join(',') : undefined}
                isMyBookingsView={isMyLeadsPath || searchParams.get('myBookings') === 'true'}
                outstandingFilter={isOutstandingOnly}
                groupFilter={selectedDepartment || undefined}
                onlyCallLogs={isAllLeadsPath}
            />

            <NewBookingModal
                isOpen={isNewBookingModalOpen}
                onClose={() => setIsNewBookingModalOpen(false)}
            />
        </div>
    );
};
