import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { jwtDecode } from 'jwt-decode';
import { useQueryClient } from '@tanstack/react-query';
import api, { lastApiCallTime } from '../api/client';

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
                setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role, permissions: decoded.permissions });
            } catch (e) {
                setToken(null);
                localStorage.removeItem('token');
            }
        } else {
            setUser(null);
        }
    }, [token]);

    // Smart presence tracking:
    // - Active users: lastSeen updated by auth middleware on every API call (0 extra requests)
    // - Idle users: if tab is visible & no API call in 4 min, send 1 lightweight ping
    // - Goodbye: best-effort instant-offline when last tab closes
    useEffect(() => {
        if (!token || !user?.id) return;

        // --- Smart idle heartbeat ---
        const IDLE_THRESHOLD = 4 * 60 * 1000; // 4 minutes
        const CHECK_INTERVAL = 60 * 1000;      // Check every 60 seconds
        const IDLE_PING_KEY = 'crm_last_idle_ping'; // Cross-tab dedup

        const idleCheck = setInterval(() => {
            // Only ping if: tab is visible + no API call recently + no other tab pinged recently
            if (document.visibilityState !== 'visible') return;

            const timeSinceLastCall = Date.now() - lastApiCallTime;
            if (timeSinceLastCall < IDLE_THRESHOLD) return;

            // Cross-tab dedup: don't ping if another tab already did recently
            const lastPing = parseInt(localStorage.getItem(IDLE_PING_KEY) || '0', 10);
            if (Date.now() - lastPing < IDLE_THRESHOLD) return;

            // Send lightweight idle ping
            localStorage.setItem(IDLE_PING_KEY, String(Date.now()));
            api.post('/users/heartbeat').catch(() => {});
        }, CHECK_INTERVAL);

        // --- Goodbye signal ---
        const TAB_COUNT_KEY = 'crm_active_tabs';
        const currentCount = parseInt(localStorage.getItem(TAB_COUNT_KEY) || '0', 10);
        localStorage.setItem(TAB_COUNT_KEY, String(currentCount + 1));

        const handleGoodbye = () => {
            const count = parseInt(localStorage.getItem(TAB_COUNT_KEY) || '1', 10);
            const newCount = Math.max(0, count - 1);
            localStorage.setItem(TAB_COUNT_KEY, String(newCount));

            if (newCount === 0) {
                const payload = JSON.stringify({ userId: user?.id });
                const blob = new Blob([payload], { type: 'application/json' });
                const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '');
                navigator.sendBeacon(`${apiBase}/api/users/offline`, blob);
            }
        };

        window.addEventListener('beforeunload', handleGoodbye);

        return () => {
            clearInterval(idleCheck);
            window.removeEventListener('beforeunload', handleGoodbye);
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
