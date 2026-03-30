import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, UserSquare, Calendar, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const BottomNav: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();

    const navItems = [
        { label: 'Overview', path: '/', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'AGENT'] },
        { label: 'All Bookings', path: '/bookings', icon: <FileText size={18} />, roles: ['ADMIN', 'AGENT'] },
        { label: 'My Bookings', path: '/my-bookings', icon: <UserSquare size={18} />, roles: ['ADMIN', 'AGENT'] },
        { label: 'Calendar', path: '/calendar', icon: <Calendar size={18} />, roles: ['ADMIN', 'AGENT'] },
        { label: 'Users', path: '/users', icon: <Users size={18} />, roles: ['ADMIN'] },
        { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} />, roles: ['ADMIN'] },
    ];

    const visibleItems = navItems.filter(item => item.roles.includes(user?.role || ''));

    return (
        <nav className="md:hidden fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-lg shadow-[0_-8px_32px_rgba(0,0,0,0.05)] border-t border-slate-200 safe-area-pb">
            <div className="flex items-center justify-between w-full px-1 pb-2 pt-2">
                {visibleItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 px-0.5 py-1.5 transition-all rounded-xl",
                                isActive 
                                    ? "bg-primary/5 text-primary" 
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <span className={cn("mb-1", isActive ? "text-primary scale-110 shadow-sm" : "text-slate-400")}>
                                {item.icon}
                            </span>
                            <span className={cn(
                                "text-[9px] font-medium tracking-tight truncate w-full text-center",
                                isActive ? "font-bold text-primary" : ""
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
