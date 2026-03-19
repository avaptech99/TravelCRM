import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AddUserModal } from '../features/users/components/AddUserModal';

dayjs.extend(relativeTime);
import { EditUserModal } from '../features/users/components/EditUserModal';
import { Trash2, Plus, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { BookingsTable } from '../features/bookings/components/BookingsTable';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isOnline: boolean;
    lastSeen: string;
    createdAt: string;
}

export const Users: React.FC = () => {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [travelDateFilter, setTravelDateFilter] = useState('all');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        },
        refetchInterval: 30000, // Refresh status every 30s
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (window.confirm('Are you sure you want to delete this user?')) {
                await api.delete(`/users/${id}`);
            } else {
                return Promise.reject(new Error('Cancelled'));
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted successfully');
        },
        onError: (error: any) => {
            if (error.message !== 'Cancelled') {
                toast.error(error.response?.data?.message || 'Failed to delete user');
            }
        }
    });

    const unassignMutation = useMutation({
        mutationFn: async ({ userId, minutes }: { userId: string, minutes: number }) => {
            const { data } = await api.post(`/users/${userId}/unassign-bookings`, { timeThresholdMinutes: minutes });
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(data.message);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to unassign bookings');
        }
    });

    const [cleanupTime, setCleanupTime] = useState('1440'); // Default to 1 Day

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
                    <p className="text-slate-500 text-sm mt-1">View and manage all system administrators and agents.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cleanup Period:</span>
                        <select
                            value={cleanupTime}
                            onChange={(e) => setCleanupTime(e.target.value)}
                            className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer pr-8"
                        >
                            <option value="1440">1 Day</option>
                            <option value="2880">2 Days</option>
                            <option value="4320">3 Days</option>
                            <option value="5760">4 Days</option>
                            <option value="7200">5 Days</option>
                            <option value="8640">6 Days</option>
                            <option value="10080">1 Week</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-gradient hover:opacity-90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={18} /> Add New User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading users...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined On</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {users?.map((user: User) => (
                                    <React.Fragment key={user.id}>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 cursor-pointer flex items-center gap-2"
                                                onClick={() => {
                                                    if (user.role === 'AGENT') {
                                                        setExpandedUserId(expandedUserId === user.id ? null : user.id);
                                                    }
                                                }}
                                            >
                                                {user.role === 'AGENT' && (
                                                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                                        {expandedUserId === user.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                )}
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                <span className={`font-semibold ${user.isOnline ? 'text-green-600' : 'text-slate-500'}`}>
                                                    {user.isOnline ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                            {!user.isOnline && user.lastSeen && (
                                                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                                    Last seen: {dayjs(user.lastSeen).fromNow()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {dayjs(user.createdAt).format('MMM DD, YYYY')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                                            {user.role === 'AGENT' && (
                                                <button
                                                    onClick={() => unassignMutation.mutate({ userId: user.id, minutes: parseInt(cleanupTime) })}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                                                    title={`Unassign inactive bookings (> ${dayjs().subtract(parseInt(cleanupTime), 'minute').fromNow(true)})`}
                                                    disabled={unassignMutation.isPending}
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Unassign</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setEditUser(user)}
                                                className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
                                                title="Edit user"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteMutation.mutate(user.id)}
                                                className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                                                title="Delete user"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Inline Bookings View */}
                                    {expandedUserId === user.id && (
                                        <tr>
                                            <td colSpan={6} className="bg-slate-50/50 p-6 border-b border-slate-200">
                                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                                    <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
                                                        <h3 className="text-sm font-bold text-slate-800">
                                                            {user.name}'s Assignments
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Travel Date:</span>
                                                            <select
                                                                value={travelDateFilter}
                                                                onChange={(e) => setTravelDateFilter(e.target.value)}
                                                                className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md py-1 px-2 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm min-w-[130px]"
                                                            >
                                                                <option value="all">All Dates</option>
                                                                <option value="upcoming_7_days">Next 7 Days</option>
                                                                <option value="upcoming_15_days">Next 15 Days</option>
                                                                <option value="upcoming_30_days">Next 30 Days</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="p-0">
                                                        <BookingsTable
                                                            agentFilter={user.id}
                                                            travelDateFilter={travelDateFilter === 'all' ? undefined : travelDateFilter}
                                                            isInlineView={true}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))}
                                {!users?.length && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditUserModal isOpen={!!editUser} onClose={() => setEditUser(null)} user={editUser} />
        </div>
    );
};
