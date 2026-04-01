import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

// Extended to include the new 'user' role (profile-based access)
type AllowedRole = 'owner' | 'supervisor' | 'operator' | 'user';

interface RoleGuardProps {
    allowedRoles: AllowedRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
    const { user, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || !allowedRoles.includes(user.role as AllowedRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
