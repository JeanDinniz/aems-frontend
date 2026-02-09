import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import type { Permissions, UserRole } from '@/types/auth.types';

export function usePermissions(): Permissions {
    const { user } = useAuthStore();

    return useMemo(() => {
        if (!user) {
            return {
                canManageUsers: false,
                canApprove: false,
                canViewAllStores: false,
                canAccessBI: false,
                canCreateServiceOrders: false,
                canManageInventory: false,
                canRequestPurchases: false,
                canViewIncidents: false,
            };
        }

        const role = user.role;

        return {
            canManageUsers: role === 'owner',
            canApprove: role === 'owner' || role === 'supervisor',
            canViewAllStores: role === 'owner',
            canAccessBI: role === 'owner',
            canCreateServiceOrders: true, // Todos podem criar
            canManageInventory: true, // Todos podem gerenciar
            canRequestPurchases: true, // Todos podem solicitar
            canViewIncidents: role === 'owner' || role === 'supervisor',
        };
    }, [user]);
}

// Hook auxiliar para verificar role específica
export function useHasRole(allowedRoles: UserRole[]): boolean {
    const { user } = useAuthStore();
    return user ? allowedRoles.includes(user.role) : false;
}
