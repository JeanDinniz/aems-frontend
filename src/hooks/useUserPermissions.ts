import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/api/users.service';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import type { UserPermissionsUpdate } from '@/types/user.types';

export function useUserPermissions(userId: number | null) {
    return useQuery({
        queryKey: ['user-permissions', userId],
        queryFn: () => usersService.getPermissions(userId!),
        enabled: userId !== null,
    });
}

export function useUpdateUserPermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: number; data: UserPermissionsUpdate }) =>
            usersService.updatePermissions(userId, data),
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
            toast({ title: 'Permissões salvas com sucesso!' });
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar permissões',
                description: getApiErrorMessage(error),
            });
        },
    });
}
