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
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Effect to check and load remembered email and password
    React.useEffect(() => {
        const savedEmail = localStorage.getItem('remembered_email');
        const savedPassword = localStorage.getItem('remembered_password');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
        if (savedPassword) {
            try { setPassword(atob(savedPassword)); } catch (e) {}
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            
            // Persist email and password if remember me is checked
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
                localStorage.setItem('remembered_password', btoa(password));
            } else {
                localStorage.removeItem('remembered_email');
                localStorage.removeItem('remembered_password');
            }

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
                    
                        <img src={logo} alt="Travel Window" className="w-24 md:w-48 h-auto"/>
                    
                </div>

                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                     Sign-In to CRM
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
                                    placeholder="user@travel.com"
                                />
                            </div>
                        </div>

                       <div>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 px-1">
        Password
    </label>
    <div className="mt-1 relative"> {/* Added 'relative' here */}
        <input
            type={showPassword ? "text" : "password"} 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all pr-12" // Added 'pr-12' for space
            placeholder="Enter your password"
        />
        
        {/* Toggle Button */}
        <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
            {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644m17.823.644a1.012 1.012 0 0 1 0-.644M12 18.75c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.897-1.132M12 5.25c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 0 1-1.897 1.132M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
            )}
        </button>
    </div>
</div>
<div className="flex items-center justify-between mt-4 px-1">
    <div className="flex items-center">
        <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer transition-all"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
            Remember me
        </label>
    </div>
</div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-brand-gradient hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] tracking-wide"
                            >
                                {loading ? 'Checking credentials...' : 'SIGN IN '}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
