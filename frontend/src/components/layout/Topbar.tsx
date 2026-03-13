import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Lock } from 'lucide-react';
import { ChangePasswordModal } from '../ChangePasswordModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { Notification } from '../../types';
import dayjs from 'dayjs';

export const Topbar: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            const { data } = await api.get('/notifications');
            return data;
        },
        enabled: !!user?.id,
        refetchInterval: 30000, // Check every 30s
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            // Optimistically or background update
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
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

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
            <div className="flex-1">
                {/* Placeholder for global search if needed */}
                <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-6">
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
                                {unreadCount > 0 && (
                                    <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="max-h-[360px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                                        No notifications yet
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map((notification) => (
                                            <div 
                                                key={notification._id} 
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${!notification.read ? 'bg-secondary/5' : ''}`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!notification.read ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {dayjs(notification.createdAt).format('MMM DD, h:mm A')}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="flex-shrink-0 mt-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Change Password */}
                <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                >
                    <Lock size={16} />
                    <span>Change Password</span>
                </button>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </header>
    );
};
