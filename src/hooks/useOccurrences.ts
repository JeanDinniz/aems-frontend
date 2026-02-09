import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { occurrencesService } from '@/services/api/occurrences.service';
import type {
    OccurrenceFilters,
    CreateOccurrenceDTO,
    UpdateOccurrenceDTO,
    AcknowledgeOccurrenceDTO
} from '@/types/occurrence.types';
import { useToast } from '@/hooks/use-toast';

export function useOccurrences(filters?: OccurrenceFilters) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data, isLoading, error } = useQuery({
        queryKey: ['occurrences', filters],
        queryFn: () => occurrencesService.list(filters),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateOccurrenceDTO) => occurrencesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['occurrences'] });
            toast({
                title: 'Sucesso',
                description: 'Ocorrência criada com sucesso.',
            });
        },
        onError: (error: any) => {
            let errorMessage = 'Não foi possível criar a ocorrência.';

            if (error.response?.status === 403) {
                errorMessage = 'Você não tem permissão para criar ocorrências.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Funcionário ou loja não encontrado.';
            } else if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || 'Dados inválidos. Verifique o formulário.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast({
                title: 'Erro ao criar ocorrência',
                description: errorMessage,
                variant: 'destructive',
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateOccurrenceDTO }) =>
            occurrencesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['occurrences'] });
            toast({
                title: 'Ocorrência atualizada',
                description: 'As alterações foram salvas com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao atualizar ocorrência',
                description: error.response?.data?.message || 'Ocorreu um erro ao tentar atualizar a ocorrência.',
                variant: 'destructive',
            });
        },
    });

    const acknowledgeMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: AcknowledgeOccurrenceDTO }) =>
            occurrencesService.acknowledge(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['occurrences'] });
            toast({
                title: 'Sucesso',
                description: 'Ocorrência reconhecida.',
            });
        },
        onError: (error: any) => {
            let errorMessage = 'Não foi possível reconhecer a ocorrência.';

            if (error.response?.status === 403) {
                errorMessage = 'Você não tem permissão para reconhecer esta ocorrência.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Ocorrência não encontrada.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast({
                title: 'Erro ao reconhecer',
                description: errorMessage,
                variant: 'destructive',
            });
        },
    });

    return {
        occurrences: data?.occurrences || [],
        total: data?.total || 0,
        isLoading,
        error,
        createOccurrence: createMutation.mutateAsync,
        updateOccurrence: updateMutation.mutateAsync,
        acknowledgeOccurrence: acknowledgeMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isAcknowledging: acknowledgeMutation.isPending,
    };
}
