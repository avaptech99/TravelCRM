import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, FileText, CheckCircle, Settings as SettingsIcon, UserSquare, BarChart3, Calendar, PhoneMissed } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo.png';
import type { SSEMode } from '../../hooks/useSSE';

interface SidebarProps {
    sseMode?: SSEMode;
}

export const Sidebar: React.FC<SidebarProps> = ({ sseMode }) => {
    const { user } = useAuth();
    const location = useLocation();




    const navItems = [
        { label: 'Overview', path: '/', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'AGENT', 'MARKETER'] },
        { label: 'All Leads', path: '/bookings', icon: <FileText size={20} />, roles: ['ADMIN', 'AGENT', 'VISA', 'TICKETING'] },
        { label: 'My Leads', path: '/mybooking', icon: <UserSquare size={20} />, roles: ['ADMIN', 'AGENT', 'MARKETER', 'VISA', 'TICKETING'] },
        { label: 'Unassigned', path: '/unassignedbooking', icon: <Users size={20} />, roles: ['ADMIN', 'AGENT'] },
        { label: 'Missed Calls', path: '/missedcalls', icon: <PhoneMissed size={20} />, roles: ['ADMIN', 'AGENT'] },
        { label: 'Booked / EDT', path: '/booked', icon: <CheckCircle size={20} />, roles: ['ADMIN', 'AGENT', 'OPERATION', 'ACCOUNT'] },
        { label: 'Travel Calendar', path: '/calendar', icon: <Calendar size={20} />, roles: ['ADMIN', 'AGENT'] },
        { label: 'Users', path: '/users', icon: <Users size={20} />, roles: ['ADMIN'] },
        { label: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, roles: ['ADMIN', 'ACCOUNT'] },
        { label: 'Settings', path: '/settings', icon: <SettingsIcon size={20} />, roles: ['ADMIN', 'AGENT', 'MARKETER', 'VISA', 'TICKETING', 'OPERATION', 'ACCOUNT'] },
    ];

    const visibleItems = navItems.filter(item => item.roles.includes(user?.role || ''));

    return (
        <aside className="hidden md:flex w-64 bg-white text-slate-900 flex-col h-full border-r border-slate-200 shadow-sm relative">
            <div className="p-6">
                <Link to="/" className="block">
                    <img 
                        src={logo} 
                        alt="Travel Window Logo" 
                        className="h-10 w-auto object-contain hover:opacity-80 transition-opacity"
                    />
                </Link>
            </div>
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {visibleItems.map((item) => {
                    const currentPath = location.pathname + location.search;
                    
                    // Specific logic for All Leads vs Sub-filters (My Leads / Unassigned)
                    const isSubFilterActive = visibleItems.some(other => 
                        other.path.includes('?') && currentPath.includes(other.path.split('?')[1])
                    );
                    
                    const isActive = currentPath === item.path || 
                        (item.path === '/bookings' && !isSubFilterActive && location.pathname === '/bookings') ||
                        (item.path !== '/' && !item.path.includes('?') && item.path !== '/bookings' && location.pathname.startsWith(item.path));
                        
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all",
                                isActive 
                                    ? "bg-primary/10 text-primary font-bold shadow-sm border border-primary/20" 
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <span className={cn(isActive ? "text-primary" : "text-slate-400")}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

            </nav>


            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                {/* SSE Status - Very small above user card */}
                {sseMode && (
                    <div className="flex items-center gap-1 mb-2 px-1 opacity-60">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            sseMode === 'connected' ? 'bg-emerald-500 animate-pulse' : 
                            sseMode === 'polling' ? 'bg-amber-500' : 
                            sseMode === 'connecting' ? 'bg-slate-400' : 'bg-rose-500'
                        }`} />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                            {sseMode === 'connected' ? 'Live System' : sseMode === 'polling' ? 'Syncing' : sseMode}
                        </span>
                    </div>
                )}

                <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-full border border-slate-200 shadow-sm">
                        <User size={20} className="text-primary" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{user?.role}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
