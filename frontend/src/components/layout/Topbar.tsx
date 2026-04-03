import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Settings, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Notification } from '../../types';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export const Topbar: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            const { data } = await api.get('/notifications');
            return data;
        },
        enabled: !!user?.id,
        refetchInterval: 20000, // Aligned with bookings polling
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['global-sync', user?.id] });
        }
    });

    const dismissNotificationMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/notifications/${id}/dismiss`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['global-sync', user?.id] });
        }
    });

    const dismissAllNotificationsMutation = useMutation({
        mutationFn: async () => {
            await api.put('/notifications/dismiss-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['global-sync', user?.id] });
            toast.success('All notifications cleared');
        }
    });

    const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);

    const toggleStatusMutation = useMutation({
        mutationFn: async (newStatus: boolean) => {
            const { data } = await api.patch('/users/status', { isOnline: newStatus });
            return data;
        },
        onSuccess: (data) => {
            setIsOnline(data.isOnline);
            toast.success(`You are now ${data.isOnline ? 'Online' : 'Offline'}`);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => {
            toast.error('Failed to update status');
        }
    });

    const handleToggleStatus = () => {
        toggleStatusMutation.mutate(!isOnline);
    };

    // Filter out dismissed notifications for bell icon
    const visibleNotifications = notifications.filter((n: any) => !n.isDismissed);
    const unreadCount = visibleNotifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsReadMutation.mutate(notification._id);
        }
        setIsDropdownOpen(false);
        if (notification.bookingId) {
            navigate(`/bookings/${notification.bookingId}`);
        }
    };

    const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        dismissNotificationMutation.mutate(notificationId);
    };

    const handleLogout = async () => {
        try {
            await api.patch('/users/status', { isOnline: false });
        } catch (error) {
            console.error('Failed to set offline status on logout', error);
        } finally {
            logout();
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-30 relative">
            <div className="flex items-center flex-1">
                <h1 className="text-xl font-semibold text-slate-800 truncate">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-6">
                {/* Online/Offline Toggle */}
                <div className="flex items-center gap-2 md:gap-3 pr-2 md:pr-4 border-r border-slate-100">
                    <span className={`hidden md:block text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-green-500' : 'text-slate-400'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                    <button
                        onClick={handleToggleStatus}
                        disabled={toggleStatusMutation.isPending}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${isOnline ? 'bg-green-500' : 'bg-slate-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Notifications */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-1 ring-red-500/50 flex items-center justify-center">
                            </span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                                            {unreadCount} new
                                        </span>
                                    )}
                                    {visibleNotifications.length > 0 && (
                                        <button
                                            onClick={() => dismissAllNotificationsMutation.mutate()}
                                            disabled={dismissAllNotificationsMutation.isPending}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded-full transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-[360px] overflow-y-auto">
                                {visibleNotifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                                        No notifications yet
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {visibleNotifications.map((notification) => (
                                            <div 
                                                key={notification._id} 
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 group ${!notification.read ? 'bg-secondary/5' : ''}`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!notification.read ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {dayjs(notification.createdAt).format('MMM DD, h:mm A')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDismiss(e, notification._id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                        title="Dismiss"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown (Mobile Only) */}
                <div className="relative md:hidden" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors focus:outline-none"
                    >
                        <span className="font-bold text-xs uppercase">{user?.name?.charAt(0) || 'U'}</span>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user?.role}</p>
                            </div>
                            <div className="p-1">
                                <button 
                                    onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors font-medium"
                                >
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </button>
                                <button 
                                    onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium mt-1"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Direct Logout Button (Desktop Only) */}
                <button
                    onClick={handleLogout}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};
