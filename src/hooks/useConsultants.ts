import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultantsService } from '@/services/api/consultants.service';
import { toast } from '@/hooks/use-toast';
import type { CreateConsultantPayload, UpdateConsultantPayload, ConsultantFilters } from '@/types/consultant.types';

export function useConsultants(filters?: ConsultantFilters, page = 1) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['consultants', filters, page],
        queryFn: () => consultantsService.list(filters, page),
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateConsultantPayload) => consultantsService.create(payload),
        onSuccess: (newConsultant) => {
            queryClient.invalidateQueries({ queryKey: ['consultants'] });
            toast({
                title: 'Consultor criado',
                description: `${newConsultant.name} foi adicionado ao sistema.`,
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao criar consultor',
                description: error.response?.data?.detail || 'Tente novamente.',
                variant: 'destructive',
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateConsultantPayload }) =>
            consultantsService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consultants'] });
            toast({
                title: 'Consultor atualizado',
                description: 'As alterações foram salvas.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao atualizar',
                description: error.response?.data?.detail || 'Tente novamente.',
                variant: 'destructive',
            });
        },
    });

    const activateMutation = useMutation({
        mutationFn: (id: number) => consultantsService.activate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consultants'] });
            toast({ title: 'Consultor ativado' });
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: number) => consultantsService.deactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consultants'] });
            toast({ title: 'Consultor desativado' });
        },
    });

    return {
        consultants: data?.consultants || [],
        total: data?.total || 0,
        isLoading,
        error,
        createConsultant: createMutation.mutate,
        updateConsultant: updateMutation.mutate,
        activateConsultant: activateMutation.mutate,
        deactivateConsultant: deactivateMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
    };
}
