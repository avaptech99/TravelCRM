import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'sonner';
import { User, Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react';

export const Settings: React.FC = () => {
    const { user, login } = useAuth();
    
    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const profileMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.put('/users/profile', { name, email });
            return data;
        },
        onSuccess: (data) => {
            toast.success('Profile updated successfully!');
            if (data.token) {
                login(data.token); // Refresh the auth context with the new token
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        },
    });

    const passwordMutation = useMutation({
        mutationFn: async () => {
            if (newPassword !== confirmPassword) {
                throw new Error('New passwords do not match');
            }
            if (newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters');
            }
            await api.put('/users/change-password', { currentPassword, newPassword });
        },
        onSuccess: () => {
            toast.success('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.message || 'Failed to change password');
        },
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileMutation.mutate();
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordMutation.mutate();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account preferences and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Profile Information</h2>
                            <p className="text-xs text-slate-500">Update your account details</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <User size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={16} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-sm font-medium text-slate-700">Role</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Shield size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={user?.role || ''}
                                    disabled
                                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Roles cannot be changed here.</p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={profileMutation.isPending || (name === user?.name && email === user?.email)}
                                className="px-5 py-2 bg-slate-900 border border-transparent text-white rounded-md hover:bg-slate-800 shadow-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Change Password</h2>
                            <p className="text-xs text-slate-500">Ensure your account is secure</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className={`w-full px-3 py-2 border rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                                    confirmPassword && confirmPassword !== newPassword
                                        ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                                        : 'border-slate-200'
                                }`}
                            />
                            {confirmPassword && confirmPassword !== newPassword && (
                                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={passwordMutation.isPending || !currentPassword || !newPassword || newPassword !== confirmPassword}
                                className="px-5 py-2 bg-brand-gradient border border-transparent text-white rounded-md hover:opacity-90 shadow-md transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
