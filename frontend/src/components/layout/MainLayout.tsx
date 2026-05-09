import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { useSSE } from '../../hooks/useSSE';
import { useAuth } from '../../context/AuthContext';

export const MainLayout: React.FC = () => {
    const { token } = useAuth();
    const { mode } = useSSE(token);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 relative">
            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden md:block">
                <Sidebar sseMode={mode} />
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 relative">
                <Topbar />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full pb-24 md:pb-6">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
};
