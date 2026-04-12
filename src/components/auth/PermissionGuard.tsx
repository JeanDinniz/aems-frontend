import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import type { SubModule } from '@/types/accessProfile.types';

interface PermissionGuardProps {
    subModule: SubModule;
}

export function PermissionGuard({ subModule }: PermissionGuardProps) {
    const { user, isLoading, effectivePermissions } = useAuthStore();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    // Owner sempre tem acesso total
    if (user?.role === 'owner') return <Outlet />;

    // Para não-owners: verifica can_view no sub-módulo específico
    const perm = effectivePermissions?.permissions.find((p) => p.sub_module === subModule);
    if (!perm?.can_view) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
