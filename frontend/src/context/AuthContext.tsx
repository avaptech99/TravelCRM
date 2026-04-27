import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { jwtDecode } from 'jwt-decode';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
            } catch (e) {
                setToken(null);
                localStorage.removeItem('token');
            }
        } else {
            setUser(null);
        }
    }, [token]);

    // Goodbye signal (best-effort instant-offline when last tab closes)
    // Note: lastSeen is passively updated by the auth middleware on every API call,
    // so no heartbeat is needed. Users are "online" as long as they make API calls
    // within the ONLINE_THRESHOLD (5 min). The goodbye just makes offline instant.
    useEffect(() => {
        if (!token || !user?.id) return;

        const TAB_COUNT_KEY = 'crm_active_tabs';
        const currentCount = parseInt(localStorage.getItem(TAB_COUNT_KEY) || '0', 10);
        localStorage.setItem(TAB_COUNT_KEY, String(currentCount + 1));

        const handleGoodbye = () => {
            const count = parseInt(localStorage.getItem(TAB_COUNT_KEY) || '1', 10);
            const newCount = Math.max(0, count - 1);
            localStorage.setItem(TAB_COUNT_KEY, String(newCount));

            // Only send offline signal when the LAST tab is closing
            if (newCount === 0) {
                const payload = JSON.stringify({ userId: user?.id });
                const blob = new Blob([payload], { type: 'application/json' });
                const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '');
                navigator.sendBeacon(`${apiBase}/api/users/offline`, blob);
            }
        };

        window.addEventListener('beforeunload', handleGoodbye);

        return () => {
            window.removeEventListener('beforeunload', handleGoodbye);
            // Decrement tab count on React cleanup (navigation), but don't send offline signal
            const count = parseInt(localStorage.getItem(TAB_COUNT_KEY) || '1', 10);
            localStorage.setItem(TAB_COUNT_KEY, String(Math.max(0, count - 1)));
        };
    }, [token, user?.id]);

    const login = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        queryClient.clear();
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
