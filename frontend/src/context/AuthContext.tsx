import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { jwtDecode } from 'jwt-decode';
import { useQueryClient } from '@tanstack/react-query';

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

    // Goodbye Signal: Mark offline on tab/browser close (multi-tab aware)
    useEffect(() => {
        if (!token) return;

        // Use a shared counter in localStorage to track how many tabs are open
        const TAB_COUNT_KEY = 'crm_active_tabs';

        // Increment tab count on mount
        const currentCount = parseInt(localStorage.getItem(TAB_COUNT_KEY) || '0', 10);
        localStorage.setItem(TAB_COUNT_KEY, String(currentCount + 1));

        const handleGoodbye = () => {
            const count = parseInt(localStorage.getItem(TAB_COUNT_KEY) || '1', 10);
            const newCount = Math.max(0, count - 1);
            localStorage.setItem(TAB_COUNT_KEY, String(newCount));

            // Only send offline signal if this is the LAST tab closing
            if (newCount === 0) {
                const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/users/offline';
                
                fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    keepalive: true,
                    body: JSON.stringify({})
                }).catch(() => {
                    // Silently fail as tab is closing
                });
            }
        };

        window.addEventListener('beforeunload', handleGoodbye);

        return () => {
            window.removeEventListener('beforeunload', handleGoodbye);
            // Decrement on cleanup (e.g. React strict mode, SPA navigation)
            const count = parseInt(localStorage.getItem(TAB_COUNT_KEY) || '1', 10);
            localStorage.setItem(TAB_COUNT_KEY, String(Math.max(0, count - 1)));
        };
    }, [token]);

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
