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
    const [role, setRole] = useState<'ADMIN' | 'AGENT' | 'MARKETER'>('AGENT');
    const [permissions, setPermissions] = useState({
        leadVisibility: 'own',
        canAssignLeads: false,
        canEditActualCost: false,
        canVerifyBookings: false,
        canManageUsers: false,
        canViewReports: false,
        featureAccess: { visa: false, ticketing: false, operation: false, account: false }
    });

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('AGENT');
        setPermissions({
            leadVisibility: 'own',
            canAssignLeads: false,
            canEditActualCost: false,
            canVerifyBookings: false,
            canManageUsers: false,
            canViewReports: false,
            featureAccess: { visa: false, ticketing: false, operation: false, account: false }
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/users', { name, email, password, role, permissions });
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

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@travel.com"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'ADMIN' | 'AGENT' | 'MARKETER')}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                            <option value="AGENT">Agent</option>
                            <option value="MARKETER">Marketer</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <div className="border-t border-slate-200 my-2 pt-4">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Permissions & Access</h4>
                        
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">Lead Visibility</label>
                                <select
                                    value={permissions.leadVisibility}
                                    onChange={(e) => setPermissions({ ...permissions, leadVisibility: e.target.value as any })}
                                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                >
                                    <option value="own">Own Leads Only</option>
                                    <option value="all">All Leads</option>
                                    <option value="none">None</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'canAssignLeads', label: 'Assign Leads' },
                                    { key: 'canEditActualCost', label: 'Edit Actual Cost' },
                                    { key: 'canVerifyBookings', label: 'Verify Bookings' },
                                    { key: 'canManageUsers', label: 'Manage Users' },
                                    { key: 'canViewReports', label: 'View Reports' },
                                ].map((perm) => (
                                    <label key={perm.key} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={permissions[perm.key as keyof typeof permissions] as boolean}
                                            onChange={(e) => setPermissions({ ...permissions, [perm.key]: e.target.checked })}
                                            className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary focus:ring-2"
                                        />
                                        <span className="text-sm text-slate-700">{perm.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-2">
                                <label className="text-sm font-medium text-slate-700 mb-2 block">CRM Feature Access</label>
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    {['visa', 'ticketing', 'operation', 'account'].map((feature) => (
                                        <label key={feature} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={permissions.featureAccess[feature as keyof typeof permissions.featureAccess]}
                                                onChange={(e) => setPermissions({
                                                    ...permissions,
                                                    featureAccess: {
                                                        ...permissions.featureAccess,
                                                        [feature]: e.target.checked
                                                    }
                                                })}
                                                className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2"
                                            />
                                            <span className="text-sm text-slate-700 capitalize">{feature} Module</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
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
                        className="text-white bg-brand-gradient hover:opacity-90 disabled:opacity-50 font-bold rounded-lg text-sm px-5 py-2 focus:ring-4 focus:outline-none focus:ring-primary/30 transition-all ml-2 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {mutation.isPending ? 'Saving...' : 'Create User'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
