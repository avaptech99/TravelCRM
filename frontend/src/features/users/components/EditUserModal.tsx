import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
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

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: { id: string; name: string; email: string; role: string; groups?: string[] } | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user }) => {
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'AGENT' | 'MARKETER'>('AGENT');
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role as 'ADMIN' | 'AGENT' | 'MARKETER');
            setSelectedGroups(user.groups || []);
            setPassword(''); // Don't pre-fill password, only send if changing
        }
    }, [user]);

    const handleClose = () => {
        setPassword('');
        onClose();
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const payload: any = { name, email, role, groups: selectedGroups };
            if (password) {
                payload.password = password;
            }
            const { data } = await api.put(`/users/${user?.id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['agents'] }); // Also refresh agent list
            toast.success('User updated successfully!');
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    });

    const { data: dropdownSettings } = useQuery({
        queryKey: ['dropdown-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings/dropdowns');
            return data as Record<string, string[]>;
        },
    });

    const handleGroupToggle = (group: string) => {
        setSelectedGroups(prev => 
            prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
        );
    };

    const isFormValid = name.trim().length >= 2 && email.includes('@') && (!password || password.length >= 6);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit User Profile</DialogTitle>
                    <DialogDescription>
                        Update the details for this user.
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
                        <label className="text-sm font-medium text-slate-700">New Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span></label>
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

                    {role !== 'ADMIN' && dropdownSettings?.groups && dropdownSettings.groups.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700">Assign to Groups</label>
                                <div className="relative group/info">
                                    <div className="cursor-help text-slate-400 hover:text-primary transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                    </div>
                                    <div className="absolute right-0 bottom-full mb-3 w-[280px] p-4 bg-slate-900/95 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all duration-300 pointer-events-none z-[100] border border-slate-800 backdrop-blur-xl transform translate-y-2 group-hover/info:translate-y-0">
                                        <div className="font-bold mb-3 border-b border-slate-700/50 pb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                            Permission & Visibility Guide
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-primary font-bold uppercase tracking-widest text-[9px]">Package / LCC</span>
                                                <div className="flex flex-col text-slate-400 italic">
                                                    <span>• See: All leads in the system</span>
                                                    <span>• Do: Assign to anyone, Edit all details</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-primary font-bold uppercase tracking-widest text-[9px]">Visa / Ticketing</span>
                                                <div className="flex flex-col text-slate-400 italic">
                                                    <span>• See: Only their OWN leads (Created/Assigned)</span>
                                                    <span>• Do: Manage own leads. Hidden from others.</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-primary font-bold uppercase tracking-widest text-[9px]">Operation</span>
                                                <div className="flex flex-col text-slate-400 italic">
                                                    <span>• See: All "Booked" leads only</span>
                                                    <span>• Do: Full edit of all details and Actual Costs</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-primary font-bold uppercase tracking-widest text-[9px]">Account</span>
                                                <div className="flex flex-col text-slate-400 italic">
                                                    <span>• See: All "Booked" leads only</span>
                                                    <span>• Do: Manage payments, Costs & Verification</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                {dropdownSettings.groups.map((group: string) => (
                                    <label key={group} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedGroups.includes(group)}
                                            onChange={() => handleGroupToggle(group)}
                                            className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2"
                                        />
                                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{group}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
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
                        {mutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
