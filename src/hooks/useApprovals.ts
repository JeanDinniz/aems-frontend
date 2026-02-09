import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsService } from '@/services/api/approvals.service';
import { toast } from '@/hooks/use-toast';
import type { PendingApprovalFilters } from '@/types/purchase-requests.types';

export function useApprovals(filters?: PendingApprovalFilters) {
    const queryClient = useQueryClient();

    const { data: pendingRequests, isLoading } = useQuery({
        queryKey: ['approvals-pending', filters],
        queryFn: () => approvalsService.listPending(filters),
        refetchInterval: 30000, // Atualiza a cada 30s
    });

    const { data: stats } = useQuery({
        queryKey: ['approvals-stats'],
        queryFn: () => approvalsService.getStats(),
        refetchInterval: 60000, // Atualiza a cada 1min
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
            approvalsService.approve(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals-pending'] });
            queryClient.invalidateQueries({ queryKey: ['approvals-stats'] });
            toast({
                title: 'Solicitação aprovada',
                description: 'O solicitante será notificado.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro ao aprovar',
                description: 'Tente novamente.',
                variant: 'destructive',
            });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, notes }: { id: number; notes: string }) =>
            approvalsService.reject(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals-pending'] });
            queryClient.invalidateQueries({ queryKey: ['approvals-stats'] });
            toast({
                title: 'Solicitação rejeitada',
                description: 'O solicitante será notificado.',
            });
        },
    });

    const approvePartialMutation = useMutation({
        mutationFn: ({
            id,
            itemIds,
            notes,
        }: {
            id: number;
            itemIds: number[];
            notes?: string;
        }) => approvalsService.approvePartial(id, itemIds, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals-pending'] });
            toast({ title: 'Aprovação parcial realizada' });
        },
    });

    return {
        pendingRequests: pendingRequests || [],
        stats,
        isLoading,
        approve: approveMutation.mutate,
        reject: rejectMutation.mutate,
        approvePartial: approvePartialMutation.mutate,
        isApproving: approveMutation.isPending,
        isRejecting: rejectMutation.isPending,
    };
}
