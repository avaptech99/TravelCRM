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
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight overflow-hidden text-ellipsis whitespace-nowrap" title={value.toString()}>{value}</div>
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
        companyName: '',
    });

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
            const { data } = await api.get('/analytics/revenue-trends', { params: { interval: 'month', companyName: filters.companyName } });
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

    const [showPending, setShowPending] = useState(false);
    const [showReceived, setShowReceived] = useState(false);
    const [isMetricsOpen, setIsMetricsOpen] = useState(true);

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
                            value={filters.companyName}
                            onChange={(e) => setFilters(prev => ({ ...prev, companyName: e.target.value }))}
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
                                    Monthly Revenue Trend
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

            {/* Payment Breakdown Section */}
            <div className="space-y-6 px-2">
                {/* Pending Payments */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowPending(!showPending)}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><ArrowDownRight size={18} /></div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800">Pending Payments</h3>
                                <p className="text-xs text-slate-500">{paymentBreakdown?.pending?.length || 0} bookings • Total: ₹{(paymentBreakdown?.totalPending || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        {showPending ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    {showPending && (
                        <div className="border-t border-slate-100 overflow-x-auto">
                            {isBreakdownLoading ? (
                                <div className="p-8 text-center text-slate-400"><Loader2 size={20} className="animate-spin mx-auto" /></div>
                            ) : (paymentBreakdown?.pending?.length || 0) === 0 ? (
                                <NoDataPlaceholder message="No pending payments found" icon={<ArrowDownRight size={32} className="opacity-20" />} />
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                            <th className="text-left p-4">Code</th>
                                            <th className="text-left p-4">Contact</th>
                                            <th className="text-left p-4">Company</th>
                                            <th className="text-right p-4">Total</th>
                                            <th className="text-right p-4">Paid</th>
                                            <th className="text-right p-4">Outstanding</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paymentBreakdown.pending.map((p: any) => (
                                            <tr key={p.bookingId} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-semibold text-primary">{p.uniqueCode}</td>
                                                <td className="p-4 text-slate-700">{p.contactPerson}</td>
                                                <td className="p-4 text-slate-500">{p.companyName || '—'}</td>
                                                <td className="p-4 text-right text-slate-700">₹{p.totalAmount.toLocaleString()}</td>
                                                <td className="p-4 text-right text-emerald-600 font-medium">₹{p.totalPaid.toLocaleString()}</td>
                                                <td className="p-4 text-right text-red-600 font-bold">₹{p.outstanding.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Received Payments */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowReceived(!showReceived)}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><ArrowUpRight size={18} /></div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800">Received Payments</h3>
                                <p className="text-xs text-slate-500">{paymentBreakdown?.received?.length || 0} payments • Total: ₹{(paymentBreakdown?.totalReceived || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        {showReceived ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    {showReceived && (
                        <div className="border-t border-slate-100 overflow-x-auto">
                            {isBreakdownLoading ? (
                                <div className="p-8 text-center text-slate-400"><Loader2 size={20} className="animate-spin mx-auto" /></div>
                            ) : (paymentBreakdown?.received?.length || 0) === 0 ? (
                                <NoDataPlaceholder message="No received payments found" icon={<CheckCircle2 size={32} className="opacity-20" />} />
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                            <th className="text-left p-4">Code</th>
                                            <th className="text-left p-4">Contact</th>
                                            <th className="text-left p-4">Company</th>
                                            <th className="text-left p-4">Method</th>
                                            <th className="text-right p-4">Amount</th>
                                            <th className="text-right p-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paymentBreakdown.received.map((p: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-semibold text-primary">{p.uniqueCode}</td>
                                                <td className="p-4 text-slate-700">{p.contactPerson}</td>
                                                <td className="p-4 text-slate-500">{p.companyName || '—'}</td>
                                                <td className="p-4 text-slate-500">{p.paymentMethod}</td>
                                                <td className="p-4 text-right text-emerald-600 font-bold">₹{p.amount.toLocaleString()}</td>
                                                <td className="p-4 text-right text-slate-500">{dayjs(p.date).format('DD MMM YYYY')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
