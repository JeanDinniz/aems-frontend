import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { usersService } from '@/services/api/users.service';

/**
 * Busca as permissões do usuário logado.
 * Owner sempre tem acesso total — não dispara a query.
 */
export function useMyPermissions() {
    const user = useAuthStore((s) => s.user);
    const isOwner = user?.role === 'owner';

    return useQuery({
        queryKey: ['my-permissions', user?.id],
        queryFn: () => usersService.getPermissions(user!.id),
        enabled: !!user && !isOwner,
        staleTime: Infinity, // só muda quando owner edita via UserPermissionsDialog
    });
}

/**
 * Retorna true se o usuário pode visualizar o módulo.
 * Owner sempre retorna true.
 * Usuários sem permissões configuradas recebem acesso padrão (true).
 */
export function useCanView(moduleKey: string): boolean {
    const user = useAuthStore((s) => s.user);
    const { data } = useMyPermissions();

    if (!user) return false;
    if (user.role === 'owner') return true;

    // Se as permissões ainda não carregaram, permite por padrão
    if (!data) return true;

    const found = data.module_permissions.find((p) => p.module === moduleKey);
    // Se o módulo não está configurado, permite por padrão
    return found?.can_view ?? true;
}
