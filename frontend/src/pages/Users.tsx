import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import dayjs from 'dayjs';
import { AddUserModal } from '../features/users/components/AddUserModal';
import { EditUserModal } from '../features/users/components/EditUserModal';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export const Users: React.FC = () => {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        },
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
                    <p className="text-slate-500 text-sm mt-1">View and manage all system administrators and agents.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-gradient hover:opacity-90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={18} /> Add New User
                </button>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined On</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {users?.map((user: User) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {user.name}
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
