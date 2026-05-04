import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'sonner';
import { User, Lock, Mail, Shield, Eye, EyeOff, Plus, Settings2, Building, Tag, Bookmark, FolderTree, Trash2, Check, ChevronDown } from 'lucide-react';

const DROPDOWN_LABELS: Record<string, string> = {
    'companies': 'Companies',
    'costTypes': 'Cost Types',
    'costSources': 'Cost Sources',
    'groups': 'Groups / Sections',
};

const getIconForLabel = (key: string) => {
    switch (key) {
        case 'companies': return <Building size={16} className="text-blue-500" />;
        case 'costTypes': return <Tag size={16} className="text-emerald-500" />;
        case 'costSources': return <Bookmark size={16} className="text-amber-500" />;
        case 'groups': return <FolderTree size={16} className="text-purple-500" />;
        default: return <Settings2 size={16} className="text-slate-500" />;
    }
};

const DropdownEditor: React.FC<{ settingKey: string; label: string; values: string[] }> = ({ settingKey, label, values: initialValues }) => {
    const queryClient = useQueryClient();
    const [values, setValues] = useState<string[]>(initialValues);
    const [newValue, setNewValue] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    React.useEffect(() => { setValues(initialValues); }, [initialValues]);

    const mutation = useMutation({
        mutationFn: async (newValues: string[]) => {
            await api.put(`/settings/dropdowns/${settingKey}`, { values: newValues });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dropdown-settings'] });
            toast.success(`${label} updated!`);
        },
        onError: () => toast.error(`Failed to update ${label}`),
    });

    const handleSave = () => {
        const val = newValue.trim();
        if (!val) return;

        if (editingIndex !== null) {
            // Edit existing
            if (!values.includes(val) || values[editingIndex] === val) {
                const updated = [...values];
                updated[editingIndex] = val;
                setValues(updated);
                setNewValue('');
                setEditingIndex(null);
                mutation.mutate(updated);
            } else {
                toast.error('Value already exists');
            }
        } else {
            // Add new
            if (!values.includes(val)) {
                const updated = [...values, val];
                setValues(updated);
                setNewValue('');
                mutation.mutate(updated);
            } else {
                toast.error('Value already exists');
            }
        }
    };

    const handleDelete = () => {
        if (editingIndex !== null) {
            const updated = values.filter((_, i) => i !== editingIndex);
            setValues(updated);
            setNewValue('');
            setEditingIndex(null);
            mutation.mutate(updated);
        }
    };

    const handleSelect = (idx: number) => {
        if (editingIndex === idx) {
            setEditingIndex(null);
            setNewValue('');
        } else {
            setEditingIndex(idx);
            setNewValue(values[idx]);
        }
    };

    return (
        <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60 min-h-[44px]">
                <div className="flex items-center gap-2">
                    {getIconForLabel(settingKey)}
                    <h4 className="text-sm font-bold text-slate-800">{label}</h4>
                </div>
                {editingIndex !== null && (
                    <button 
                        type="button"
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete selected option"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6 flex-1 content-start">
                {values.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No options configured.</span>
                )}
                {values.map((v, idx) => (
                    <button 
                        key={idx}
                        type="button"
                        onClick={() => handleSelect(idx)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm transition-all ${
                            editingIndex === idx
                                ? 'bg-slate-800 text-white border-slate-800 scale-105'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
            
            <div className="relative mt-auto">
                <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
                    placeholder={editingIndex !== null ? "Edit selected..." : "Add new..."}
                    className="w-full pl-4 pr-24 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-sm transition-all"
                />
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!newValue.trim() || mutation.isPending}
                    className={`absolute right-1 top-1 bottom-1 px-4 text-white text-[11px] font-bold tracking-wider uppercase rounded-md transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 ${
                        editingIndex !== null 
                            ? 'bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600'
                            : 'bg-slate-900 hover:bg-slate-800 disabled:hover:bg-slate-900'
                    }`}
                >
                    {editingIndex !== null ? <><Check size={12} strokeWidth={3} /> Edit</> : <><Plus size={12} strokeWidth={3} /> Add</>}
                </button>
            </div>
        </div>
    );
};

export const Settings: React.FC = () => {
    const { user, login } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [isDropdownExpanded, setIsDropdownExpanded] = useState(true);

    const { data: dropdownSettings } = useQuery({
        queryKey: ['dropdown-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings/dropdowns');
            return data as Record<string, string[]>;
        },
        enabled: isAdmin,
    });

    const profileMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.put('/users/profile', { name, email });
            return data;
        },
        onSuccess: (data) => {
            toast.success('Profile updated successfully!');
            if (data.token) login(data.token);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        },
    });

    const passwordMutation = useMutation({
        mutationFn: async () => {
            if (newPassword !== confirmPassword) throw new Error('New passwords do not match');
            if (newPassword.length < 6) throw new Error('New password must be at least 6 characters');
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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account preferences and security.</p>
            </div>

            {/* Admin-managed Dropdown Settings */}
            {isAdmin && dropdownSettings && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <button 
                        onClick={() => setIsDropdownExpanded(!isDropdownExpanded)}
                        className="w-full p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between group transition-colors hover:bg-slate-100/50"
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500"><Settings2 size={20} /></div>
                            <div>
                                <h2 className="font-semibold text-slate-800">Dropdown Management</h2>
                                <p className="text-xs text-slate-500">Manage dropdown options used across the CRM</p>
                            </div>
                        </div>
                        <ChevronDown 
                            size={20} 
                            className={`text-slate-400 transition-transform duration-300 ${isDropdownExpanded ? 'rotate-180' : ''}`} 
                        />
                    </button>
                    <div 
                        className="transition-all duration-300 ease-in-out overflow-hidden"
                        style={{ maxHeight: isDropdownExpanded ? '2000px' : '0' }}
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.keys(DROPDOWN_LABELS).map(key => (
                                <DropdownEditor key={key} settingKey={key} label={DROPDOWN_LABELS[key]} values={dropdownSettings[key] || []} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><User size={20} /></div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Profile Information</h2>
                            <p className="text-xs text-slate-500">Update your account details</p>
                        </div>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(); }} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={16} /></div>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={user?.role === 'AGENT'} className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail size={16} /></div>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={user?.role === 'AGENT'} className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
                            </div>
                        </div>
                        <div className="space-y-1.5 pt-2">
                            <label className="text-sm font-medium text-slate-700">Role</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Shield size={16} /></div>
                                <input type="text" value={user?.role || ''} disabled className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{user?.role === 'AGENT' ? 'Please contact an administrator to change your profile details.' : 'Roles cannot be changed here.'}</p>
                        </div>
                        {user?.role !== 'AGENT' && (
                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={profileMutation.isPending || (name === user?.name && email === user?.email)} className="px-5 py-2 bg-slate-900 border border-transparent text-white rounded-md hover:bg-slate-800 shadow-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                    {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Password Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><Lock size={20} /></div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Change Password</h2>
                            <p className="text-xs text-slate-500">Ensure your account is secure</p>
                        </div>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); passwordMutation.mutate(); }} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Current Password</label>
                            <div className="relative">
                                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">New Password</label>
                            <div className="relative">
                                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`w-full px-3 py-2 border rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400 focus:ring-red-200 focus:border-red-500' : 'border-slate-200'}`} />
                            {confirmPassword && confirmPassword !== newPassword && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={passwordMutation.isPending || !currentPassword || !newPassword || newPassword !== confirmPassword} className="px-5 py-2 bg-brand-gradient border border-transparent text-white rounded-md hover:opacity-90 shadow-md transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                                {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
