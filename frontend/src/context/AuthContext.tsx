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

    // Heartbeat + multi-tab aware goodbye signal
    useEffect(() => {
        if (!token) return;

        const sendHeartbeat = async () => {
            try {
                await api.post('/users/heartbeat');
            } catch (error) {
                console.debug('Heartbeat ping');
            }
        };

        // Initial heartbeat
        sendHeartbeat();

        // Every 2 minutes
        const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);

        // Multi-tab aware goodbye signal
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
            clearInterval(interval);
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
