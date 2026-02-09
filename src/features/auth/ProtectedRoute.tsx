import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth.types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                <p>Você não tem permissão para acessar esta página.</p>
                <Navigate to="/dashboard" replace /> {/* Or Go Back button */}
            </div>
        );
    }

    return <Outlet />;
}
