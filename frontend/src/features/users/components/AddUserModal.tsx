import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../../../components/ui/dialog';
import api from '../../../api/client';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'AGENT'>('AGENT');

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('AGENT');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/users', { name, email, password, role });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User created successfully!');
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    });

    const isFormValid = name.trim().length >= 2 && email.includes('@') && password.length >= 6;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new admin or agent account.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@travel.com"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'ADMIN' | 'AGENT')}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                        >
                            <option value="AGENT">Agent</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                </div>

                <DialogFooter>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-slate-600 bg-white hover:bg-slate-50 font-medium rounded-lg text-sm px-4 py-2 border border-slate-200 focus:ring-4 focus:outline-none focus:ring-slate-100"
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || !isFormValid}
                        className="text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 font-medium rounded-lg text-sm px-5 py-2 focus:ring-4 focus:outline-none focus:ring-indigo-300 transition-colors ml-2"
                    >
                        {mutation.isPending ? 'Saving...' : 'Create User'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
