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

    // Goodbye Signal: Mark offline on tab/browser close
    useEffect(() => {
        if (!token) return;

        const handleGoodbye = () => {
            // Use fetch with keepalive: true to ensure the request finishes after the tab closes
            // axios doesn't support keepalive easily, so we use native fetch
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/users/offline';
            
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                keepalive: true, // Crucial for "Goodbye" signals
                body: JSON.stringify({})
            }).catch(() => {
                // Silently fail as tab is closing
            });
        };

        window.addEventListener('beforeunload', handleGoodbye);
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Optional: You could mark as 'Away' here
            }
        });

        return () => {
            window.removeEventListener('beforeunload', handleGoodbye);
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
