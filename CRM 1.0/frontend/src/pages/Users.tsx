import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AddUserModal } from '../features/users/components/AddUserModal';

dayjs.extend(relativeTime);

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    AGENT: 'bg-purple-50 text-purple-700 border-purple-100',
    MARKETER: 'bg-amber-50 text-amber-700 border-amber-100',
};
import { EditUserModal } from '../features/users/components/EditUserModal';
import { Trash2, Plus, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { BookingsTable } from '../features/bookings/components/BookingsTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

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
    const [travelDateFilter, setTravelDateFilter] = useState('upcoming_7_days');
    const [unassignUserId, setUnassignUserId] = useState<string | null>(null);

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        },
        refetchInterval: 30000, // Refresh status every 30s
    });

    const displayUsers = users?.filter((u: User) => u.email !== 'website-lead@system.internal');

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
            setUnassignUserId(null);
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
                    <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">Manage Users</h1>
                    <p className="text-slate-500 text-sm mt-1">View and manage all system administrators and agents.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center md:justify-start gap-2 bg-brand-gradient hover:opacity-90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto"
                    >
                        <Plus size={18} /> Add New User
                    </button>
                </div>
            </div>

            <div className="bg-transparent md:bg-white rounded-none md:rounded-lg shadow-none md:shadow-sm border-0 md:border border-slate-200 overflow-hidden">
                <div className="w-full">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 bg-white rounded-lg shadow-sm border border-slate-200">Loading users...</div>
                    ) : (
                        <>
                            {/* Desktop View Table */}
                            <div className="hidden md:block overflow-x-auto">
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
                                {displayUsers?.map((user: User) => (
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
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {dayjs(user.createdAt).format('MMM DD, YYYY')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                                            {user.role === 'AGENT' && (
                                                <button
                                                    onClick={() => setUnassignUserId(user.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                                                    title="Unassign inactive bookings"
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
                                                                <option value="upcoming_7_days">Next 7 Days</option>
                                                                <option value="upcoming_10_days">Next 10 Days</option>
                                                                <option value="upcoming_15_days">Next 15 Days</option>
                                                                <option value="upcoming_30_days">Next 30 Days</option>
                                                                <option value="all">All Dates</option>
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
                                {!displayUsers?.length && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                            {/* Mobile View Cards */}
                            <div className="md:hidden flex flex-col gap-4 mt-2">
                                {displayUsers?.map((user: User) => (
                                    <div key={user.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.03)] flex flex-col gap-4 relative justify-between">
                                        <div className="flex justify-between items-start">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer"
                                                onClick={() => {
                                                    if (user.role === 'AGENT') {
                                                        setExpandedUserId(expandedUserId === user.id ? null : user.id);
                                                    }
                                                }}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-primary font-bold border border-slate-100 shadow-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-900 leading-tight">{user.name}</h3>
                                                        {user.role === 'AGENT' && (
                                                            <span className="text-slate-400 bg-slate-50 rounded p-0.5">
                                                                {expandedUserId === user.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                                {user.role}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                    <span className={`text-xs font-semibold ${user.isOnline ? 'text-green-600' : 'text-slate-500'}`}>
                                                        {user.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Joined On</span>
                                                <span className="text-xs font-semibold text-slate-700">{dayjs(user.createdAt).format('MMM DD, YYYY')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            {user.role === 'AGENT' && (
                                                <button
                                                    onClick={() => setUnassignUserId(user.id)}
                                                    className="text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50"
                                                    title="Unassign inactive bookings"
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Unassign</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setEditUser(user)}
                                                className="text-slate-500 hover:text-blue-600 transition-colors p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteMutation.mutate(user.id)}
                                                className="text-slate-500 hover:text-red-600 transition-colors p-1.5 rounded-lg border border-slate-200 hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {expandedUserId === user.id && (
                                            <div className="mt-2 bg-slate-50/50 rounded-lg border border-slate-200 overflow-hidden">
                                                <div className="border-b border-slate-200 px-3 py-2 flex items-center justify-between bg-slate-50">
                                                    <h3 className="text-xs font-bold text-slate-800 truncate mr-2">Assignments</h3>
                                                    <select
                                                        value={travelDateFilter}
                                                        onChange={(e) => setTravelDateFilter(e.target.value)}
                                                        className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-md py-1 px-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                                                    >
                                                        <option value="upcoming_7_days">Next 7 Days</option>
                                                        <option value="upcoming_10_days">Next 10 Days</option>
                                                        <option value="upcoming_15_days">Next 15 Days</option>
                                                        <option value="upcoming_30_days">Next 30 Days</option>
                                                        <option value="all">All Dates</option>
                                                    </select>
                                                </div>
                                                <div className="p-0">
                                                    <BookingsTable
                                                        agentFilter={user.id}
                                                        travelDateFilter={travelDateFilter === 'all' ? undefined : travelDateFilter}
                                                        isInlineView={true}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {!users?.length && (
                                    <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
                                        <p className="text-slate-500 text-sm">No users found.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditUserModal isOpen={!!editUser} onClose={() => setEditUser(null)} user={editUser} />
            
            <Dialog open={!!unassignUserId} onOpenChange={() => !unassignMutation.isPending && setUnassignUserId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unassign Bookings</DialogTitle>
                        <DialogDescription>
                            Select the cleanup period to apply. Any bookings currently assigned to this agent that have not been modified within this timeframe will be unassigned and returned to the system pool.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Cleanup Period</label>
                            <select
                                value={cleanupTime}
                                onChange={(e) => setCleanupTime(e.target.value)}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary w-full p-2.5"
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
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setUnassignUserId(null)}
                            className="text-slate-600 bg-white hover:bg-slate-50 font-medium rounded-lg text-sm px-4 py-2 border border-slate-200"
                            disabled={unassignMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => unassignUserId && unassignMutation.mutate({ userId: unassignUserId, minutes: parseInt(cleanupTime) })}
                            disabled={unassignMutation.isPending}
                            className="text-white bg-red-500 hover:bg-red-600 font-medium rounded-lg text-sm px-4 py-2 ml-2 transition-colors"
                        >
                            {unassignMutation.isPending ? 'Unassigning...' : 'Confirm Unassign'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
