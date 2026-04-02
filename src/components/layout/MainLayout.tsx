import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/stores/auth.store';

export function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuthStore();

    if (user?.must_change_password) {
        return <Navigate to="/change-password" replace />;
    }

    return (
        <div className="h-screen flex overflow-hidden bg-[#F5F5F5] dark:bg-[#111111]">
            {/* Sidebar — fixed on desktop, does not participate in flex flow */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content — offset by collapsed sidebar width on desktop */}
            <div className="flex-1 flex flex-col overflow-hidden md:ml-[60px]">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
