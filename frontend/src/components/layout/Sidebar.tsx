import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();

    const navItems = [
        { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { label: 'All Bookings', path: '/bookings', icon: <FileText size={20} /> },
        { label: 'Booked / EDT', path: '/booked', icon: <CheckCircle size={20} /> },
    ];

    if (user?.role === 'ADMIN') {
        // Only keep users list or other admin features if any
    }

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
            <div className="p-6">
                <h2 className="text-2xl font-bold tracking-tight text-indigo-400">Travel CRM</h2>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors",
                                isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
                {user?.role === 'ADMIN' && (
                    <Link
                        to="/users"
                        className={cn(
                            "flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors",
                            location.pathname === '/users' ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Users size={20} />
                        <span className="font-medium">Users</span>
                    </Link>
                )}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="bg-slate-800 p-2 rounded-full">
                        <User size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.role}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
