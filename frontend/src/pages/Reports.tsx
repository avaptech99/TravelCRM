import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    LabelList,
} from 'recharts';
import { 
    Calendar, 
    TrendingUp, 
    Users, 
    DollarSign, 
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    ChevronDown,
    ChevronUp,
    Building,
    CheckCircle2
} from 'lucide-react';

import dayjs from 'dayjs';
import { toCrmTz } from '../lib/formatDate';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: string; isPositive: boolean };
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, loading }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend.value}
                </div>
            )}
        </div>
        {loading ? (
            <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
        ) : (
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
        )}
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2">{title}</div>
    </div>
);

const NoDataPlaceholder: React.FC<{ message?: string; icon?: React.ReactNode }> = ({ 
    message = "No data available for this period",
    icon = <TrendingUp size={32} className="opacity-20" />
}) => (
    <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 space-y-3 py-10">
        <div className="p-4 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
            {icon}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{message}</p>
    </div>
);

export const Reports: React.FC = () => {
    const { data: dropdownSettings } = useQuery({
        queryKey: ['dropdown-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings/dropdowns');
            return data as Record<string, string[]>;
        },
    });

    const [filters, setFilters] = useState({
        fromDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD'),
        company: '',
    });

    React.useEffect(() => {
        setPendingPage(1);
        setReceivedPage(1);
    }, [filters]);


    const { data: bookingStats, isLoading: isBookingsLoading } = useQuery({
        queryKey: ['analytics-bookings', filters],
        queryFn: async () => {
            const { data } = await api.get('/analytics/bookings', { params: filters });
            return data;
        },
    });

    const { data: paymentStats, isLoading: isPaymentsLoading } = useQuery({
        queryKey: ['analytics-payments', filters],
        queryFn: async () => {
            const { data } = await api.get('/analytics/payments', { params: filters });
            return data;
        },
    });

    const { data: revenueTrends, isLoading: isTrendsLoading } = useQuery({
        queryKey: ['analytics-revenue-trends', filters],
        queryFn: async () => {
            const { data } = await api.get('/analytics/revenue-trends', { params: { interval: 'week', company: filters.company } });
            return data;
        },
    });

    const { data: agentStats, isLoading: isAgentsLoading } = useQuery({
        queryKey: ['analytics-agents', filters],
        queryFn: async () => {
            const { data } = await api.get('/analytics/agents', { params: filters });
            return data;
        },
    });

    const { data: paymentBreakdown, isLoading: isBreakdownLoading } = useQuery({
        queryKey: ['analytics-payment-breakdown', filters],
        queryFn: async () => {
            const { data } = await api.get('/analytics/payment-breakdown', { params: filters });
            return data;
        },
    });

    const [isMetricsOpen, setIsMetricsOpen] = useState(true);
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(true);
    const [pendingPage, setPendingPage] = useState(1);
    const [receivedPage, setReceivedPage] = useState(1);

    const statusData = bookingStats?.byStatus?.map((s: any) => ({ name: s._id, value: s.count })) || [];
    const interestData = bookingStats?.byInterest?.map((s: any) => ({ 
        name: s._id === 'Yes' ? 'Interested' : (s._id === 'No' ? 'Not Interested' : 'Unspecified'), 
        value: s.count 
    })) || [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Booked': return '#10b981'; // Green
            case 'Sent': return '#f59e0b';   // Yellow
            case 'Working': return '#8b5cf6'; // Purple
            case 'Pending': return '#6366f1'; // Blue
            default: return '#94a3b8';        // Slate
        }
    };

    const getInterestColor = (interest: string) => {
        switch (interest) {
            case 'Interested': return '#f59e0b';     // Yellow
            case 'Not Interested': return '#ef4444'; // Red
            default: return '#94a3b8';               // Slate
        }
    };


    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Measuring performance and data growth metrics.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">

                <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400 ml-3" />
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                            className="text-sm font-medium border-none focus:ring-0 text-slate-800 bg-transparent p-1 cursor-pointer"
                        />
                        <span className="text-slate-400 font-semibold text-[10px]">TO</span>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                            className="text-sm font-medium border-none focus:ring-0 text-slate-800 bg-transparent p-1 cursor-pointer mr-2"
                        />
                    </div>
                    <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 ml-2 border border-slate-100">
                        <Building size={14} className="text-slate-400" />
                        <select
                            value={filters.company}
                            onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                            className="text-sm font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 outline-none cursor-pointer min-w-[140px]"
                        >
                            <option value="">All Companies</option>
                            {dropdownSettings?.companies?.map(company => (
                                <option key={company} value={company}>{company}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">

                <StatCard 
                    title="Revenue Collected" 
                    value={`₹${(paymentStats?.totalCollected || 0).toLocaleString()}`} 
                    icon={<DollarSign size={20} />} 
                    loading={isPaymentsLoading}
                />
                <StatCard 
                    title="Estimated Revenue" 
                    value={`₹${(paymentStats?.totalExpected || 0).toLocaleString()}`} 
                    icon={<TrendingUp size={20} />} 
                    loading={isPaymentsLoading}
                />
                <StatCard 
                    title="Pending Balance" 
                    value={`₹${(paymentStats?.balance || 0).toLocaleString()}`} 
                    icon={<ArrowDownRight size={20} />} 
                    loading={isPaymentsLoading}
                />
                <StatCard 
                    title="Booked" 
                    value={bookingStats?.byStatus?.find((s: any) => s._id === 'Booked')?.count || 0} 
                    icon={<Users size={20} />} 
                    loading={isBookingsLoading}
                />
            </div>

            {/* Collapsible Performance Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button 
                    onClick={() => setIsMetricsOpen(!isMetricsOpen)}
                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <TrendingUp size={18} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-slate-800">Detailed Performance Metrics</h3>
                            <p className="text-xs text-slate-500">Visual breakdown of revenue, agents, and conversion status</p>
                        </div>
                    </div>
                    {isMetricsOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                
                {isMetricsOpen && (
                    <div className="p-8 border-t border-slate-100 bg-slate-50/30 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Revenue Growth Trend */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 min-h-[450px]">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-primary" />
                                    Weekly Revenue Trend
                                </h3>
                                <div className="flex-1 w-full h-[300px]">
                                    {isTrendsLoading ? (
                                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
                                    ) : (!revenueTrends || revenueTrends.length === 0) ? (
                                        <NoDataPlaceholder />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                            <AreaChart data={revenueTrends}>
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                    itemStyle={{ fontWeight: 600, fontSize: '12px' }}
                                                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Agent Performance */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 min-h-[450px]">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <Users size={16} className="text-primary" />
                                    Top Agents by Revenue
                                </h3>
                                <div className="flex-1 w-full h-[300px]">
                                    {isAgentsLoading ? (
                                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
                                    ) : (!agentStats || agentStats.length === 0) ? (
                                        <NoDataPlaceholder message="No agent performance data" icon={<Users size={32} className="opacity-20" />} />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                            <BarChart 
                                                data={agentStats?.slice(0, 5)} 
                                                layout="vertical" 
                                                margin={{ left: 20, right: 40 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" hide />
                                                <YAxis 
                                                    dataKey="agentName" 
                                                    type="category" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{fontSize: 11, fontWeight: 600, fill: '#334155'}} 
                                                    width={100} 
                                                />
                                                <Tooltip 
                                                    cursor={{fill: '#f8fafc'}}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                    formatter={(value: any, name: any, props: any) => {
                                                        if (name === 'totalRevenue') {
                                                            return [
                                                                <div key="custom-tooltip">
                                                                    <div className="text-slate-900 font-bold mb-1">₹{value.toLocaleString()}</div>
                                                                    <div className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                                                                        {props.payload.convertedBookings} Booked Queries
                                                                    </div>
                                                                </div>,
                                                                'Revenue'
                                                            ];
                                                        }
                                                        return [value, name];
                                                    }}
                                                />
                                                <Bar dataKey="totalRevenue" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24}>
                                                    <LabelList 
                                                        dataKey="convertedBookings" 
                                                        position="right" 
                                                        style={{ fill: '#64748b', fontSize: '10px', fontWeight: 'bold' }}
                                                        formatter={(value: any) => `${value} Booked`}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Booking Status Distribution */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col shrink-0">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Booking Pipeline Status</h3>
                                <div className="flex-1 w-full h-[250px]">
                                    {(!statusData || statusData.length === 0) ? (
                                        <NoDataPlaceholder message="No status data" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={95}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Interest Level */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col shrink-0">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Lead Interest Conversion</h3>
                                <div className="flex-1 w-full h-[250px]">
                                    {(!interestData || interestData.length === 0) ? (
                                        <NoDataPlaceholder message="No interest data" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                                            <PieChart>
                                                <Pie
                                                    data={interestData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={95}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                >
                                                    {interestData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={getInterestColor(entry.name)} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Agent Efficiency Table */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:col-span-1 min-h-[400px] shrink-0">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Conversion Efficiency</h3>
                                <div className="overflow-y-auto flex-1 h-[250px] pr-2 custom-scrollbar">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-white z-10">
                                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="text-left pb-4">Agent Name</th>
                                                <th className="text-right pb-4">Conv. Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {(!agentStats || agentStats.length === 0) ? (
                                                <tr>
                                                    <td colSpan={2} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No agent data available</td>
                                                </tr>
                                            ) : (
                                                agentStats?.map((agent: any) => (
                                                    <tr key={agent._id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="py-4 font-semibold text-slate-700">{agent.agentName}</td>
                                                        <td className="py-4 text-right">
                                                            <div className="flex items-center justify-end gap-3 text-primary font-semibold">
                                                                <span>{agent.conversionRate.toFixed(1)}%</span>
                                                                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                                    <div className="h-full bg-brand-gradient transition-all duration-1000" style={{ width: `${agent.conversionRate}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Unified Payment Dashboard - Now Standalone */}
            <div className="px-2">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => setIsPaymentsOpen(!isPaymentsOpen)}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <DollarSign size={18} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800">Financial Summary & Collections</h3>
                                <p className="text-xs text-slate-500">Track outstanding balances and recent payments</p>
                            </div>
                        </div>
                        {isPaymentsOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>

                    {isPaymentsOpen && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-t border-slate-100">
                            
                            {/* Pending Payments - Left Column */}
                            <div className="flex flex-col">
                                <div className="p-5 bg-slate-50/30 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-amber-50 rounded text-amber-600"><ArrowDownRight size={14} /></div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Pending Payments</h4>
                                            <p className="text-[9px] text-slate-500 font-bold">Outstanding: ₹{(paymentBreakdown?.totalPending || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    {isBreakdownLoading ? (
                                        <div className="p-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-slate-300" /></div>
                                    ) : (paymentBreakdown?.pending?.length || 0) === 0 ? (
                                        <NoDataPlaceholder message="All payments collected" icon={<CheckCircle2 size={32} className="opacity-20" />} />
                                    ) : (
                                        <table className="w-full text-sm table-fixed">
                                            <thead>
                                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                    <th className="text-left p-4 w-[18%]">ID</th>
                                                    <th className="text-left p-4 w-[32%]">Contact</th>
                                                    <th className="text-left p-4 w-[25%]">Company</th>
                                                    <th className="text-right p-4 w-[25%]">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {paymentBreakdown.pending.slice((pendingPage - 1) * 15, pendingPage * 15).map((p: any, idx: number) => (
                                                    <tr key={`${pendingPage}-${p.bookingId}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 font-bold text-primary text-[11px] truncate">{p.uniqueCode}</td>
                                                        <td className="p-4">
                                                            <div className="text-slate-700 font-semibold truncate text-xs" title={p.contactPerson}>{p.contactPerson}</div>
                                                        </td>
                                                        <td className="p-4 text-slate-500 text-[11px] truncate">{p.companyName || '—'}</td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-red-600 font-bold text-xs">₹{p.outstanding.toLocaleString()}</div>
                                                            <div className="text-[8px] opacity-0 mt-0.5 select-none">SPACER</div> {/* Row height balancer */}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                
                                <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Page {pendingPage}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setPendingPage(prev => Math.max(1, prev - 1))}
                                            disabled={pendingPage === 1}
                                            className="px-2.5 py-1 text-[9px] font-bold rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors uppercase tracking-widest"
                                        >
                                            Prev
                                        </button>
                                        <button 
                                            onClick={() => setPendingPage(prev => prev + 1)}
                                            disabled={!paymentBreakdown?.pending || pendingPage * 15 >= paymentBreakdown.pending.length}
                                            className="px-3 py-1 text-[9px] font-bold rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors uppercase tracking-widest"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Received Payments - Right Column */}
                            <div className="flex flex-col">
                                <div className="p-5 bg-slate-50/30 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-emerald-50 rounded text-emerald-600"><ArrowUpRight size={14} /></div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Received Payments</h4>
                                            <p className="text-[9px] text-slate-500 font-bold">Collected: ₹{(paymentBreakdown?.totalReceived || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    {isBreakdownLoading ? (
                                        <div className="p-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-slate-300" /></div>
                                    ) : (paymentBreakdown?.received?.length || 0) === 0 ? (
                                        <NoDataPlaceholder message="No payments received yet" icon={<DollarSign size={32} className="opacity-20" />} />
                                    ) : (
                                        <table className="w-full text-sm table-fixed">
                                            <thead>
                                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                    <th className="text-left p-4 w-[18%]">ID</th>
                                                    <th className="text-left p-4 w-[32%]">Contact</th>
                                                    <th className="text-left p-4 w-[25%]">Company</th>
                                                    <th className="text-right p-4 w-[25%]">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {paymentBreakdown.received.slice((receivedPage - 1) * 15, receivedPage * 15).map((p: any, idx: number) => (
                                                    <tr key={`${receivedPage}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="p-4 font-bold text-primary text-[11px] truncate">{p.uniqueCode}</td>
                                                        <td className="p-4">
                                                            <div className="text-slate-700 font-semibold truncate text-xs" title={p.contactPerson}>{p.contactPerson}</div>
                                                        </td>
                                                        <td className="p-4 text-slate-500 text-[11px] truncate">{p.companyName || '—'}</td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-emerald-600 font-bold text-xs">₹{p.amount.toLocaleString()}</div>
                                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{toCrmTz(p.date).format('DD MMM YYYY')}</div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Page {receivedPage}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setReceivedPage(prev => Math.max(1, prev - 1))}
                                            disabled={receivedPage === 1}
                                            className="px-2.5 py-1 text-[9px] font-bold rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors uppercase tracking-widest"
                                        >
                                            Prev
                                        </button>
                                        <button 
                                            onClick={() => setReceivedPage(prev => prev + 1)}
                                            disabled={!paymentBreakdown?.received || receivedPage * 15 >= paymentBreakdown.received.length}
                                            className="px-3 py-1 text-[9px] font-bold rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors uppercase tracking-widest"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
