import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
