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
        <div className="h-screen bg-aems-neutral-50 flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
