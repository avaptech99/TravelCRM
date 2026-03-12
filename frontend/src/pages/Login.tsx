import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import logo from '../assets/logo.png';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center justify-center">
                        <img src={logo} alt="Travel Window" className="h-16 w-auto object-contain" />
                    </div>
                </div>
                <h2 className="mt-8 text-center text-3xl font-black text-slate-900 tracking-tight">
                    Travel Window
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    Please sign in to your dashboard
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200/50 sm:rounded-2xl sm:px-12 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg p-4 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 px-1">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all"
                                    placeholder="admin@travelcrm.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 px-1">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black text-white bg-brand-gradient hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] tracking-wide"
                            >
                                {loading ? 'Checking credentials...' : 'SIGN IN TO CRM'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
