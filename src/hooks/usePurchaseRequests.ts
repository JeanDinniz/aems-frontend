import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseRequestsService } from '@/services/api/purchase-requests.service';
import type {
    PurchaseRequestFilters,
    CreatePurchaseRequestData,
    ApprovalAction,
    ReceiveGoodsData
} from '@/types/purchase-requests.types';
import { useToast } from '@/hooks/use-toast';

export const usePurchaseRequests = (filters?: PurchaseRequestFilters, skip = 0, limit = 50) => {
    return useQuery({
        queryKey: ['purchase-requests', filters, skip, limit],
        queryFn: () => purchaseRequestsService.getAll(filters, skip, limit)
    });
};

export const usePurchaseRequest = (id: number) => {
    return useQuery({
        queryKey: ['purchase-request', id],
        queryFn: () => purchaseRequestsService.getById(id),
        enabled: !!id
    });
};

export const useCreatePurchaseRequest = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (data: CreatePurchaseRequestData) => purchaseRequestsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
            toast({
                title: 'Solicitação criada',
                description: 'Sua solicitação foi enviada para aprovação.'
            });
        }
    });
};

export const useSupervisorApproval = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, action }: { id: number; action: ApprovalAction }) =>
            purchaseRequestsService.supervisorApproval(id, action),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
            toast({
                title: variables.action.approved ? 'Solicitação aprovada' : 'Solicitação rejeitada',
                description: variables.action.approved
                    ? 'A solicitação foi aprovada com sucesso.'
                    : 'A solicitação foi rejeitada.'
            });
        }
    });
};

export const useOwnerApproval = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, action }: { id: number; action: ApprovalAction }) =>
            purchaseRequestsService.ownerApproval(id, action),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
            toast({
                title: variables.action.approved ? 'Solicitação aprovada' : 'Solicitação rejeitada',
                description: variables.action.approved
                    ? 'Aprovação final concedida.'
                    : 'A solicitação foi rejeitada.'
            });
        }
    });
};

export const useMarkOrdered = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { supplier_name: string; expected_delivery: string; order_date?: string; payment_terms?: string } }) =>
            purchaseRequestsService.markOrdered(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
            toast({ title: 'Pedido Registrado', description: 'A solicitação foi marcada como pedido realizado.' });
        }
    });
};

export const useReceiveGoods = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ReceiveGoodsData }) =>
            purchaseRequestsService.receiveGoods(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
            toast({ title: 'Recebimento Registrado', description: 'Os itens foram conferidos e registrados.' });
        }
    });
};

export const useDeletePurchaseRequest = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (id: number) => purchaseRequestsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
            toast({
                title: 'Solicitação excluída',
                description: 'A solicitação foi removida com sucesso.'
            });
        }
    });
};
