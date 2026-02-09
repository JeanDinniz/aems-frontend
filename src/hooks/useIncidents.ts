import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsService } from '@/services/incidents.service';
import type { IncidentFilters, CreateIncidentDTO, UpdateIncidentDTO } from '@/types/incident.types';
import { useToast } from '@/hooks/use-toast';

export function useIncidents(filters?: IncidentFilters) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: incidents = [], isLoading, error } = useQuery({
        queryKey: ['incidents', filters],
        queryFn: () => incidentsService.list(filters),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateIncidentDTO) => incidentsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            toast({
                title: 'Incidente criado',
                description: 'O incidente foi registrado com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao criar incidente',
                description: error.response?.data?.message || 'Ocorreu um erro ao tentar criar o incidente.',
                variant: 'destructive',
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateIncidentDTO }) =>
            incidentsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            toast({
                title: 'Incidente atualizado',
                description: 'As alterações foram salvas com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao atualizar incidente',
                description: error.response?.data?.message || 'Ocorreu um erro ao tentar atualizar o incidente.',
                variant: 'destructive',
            });
        },
    });

    const resolveMutation = useMutation({
        mutationFn: ({ id, resolutionNotes }: { id: string; resolutionNotes: string }) =>
            incidentsService.resolve(id, resolutionNotes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            toast({
                title: 'Incidente resolvido',
                description: 'O incidente foi marcado como resolvido.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao resolver incidente',
                description: error.response?.data?.message || 'Ocorreu um erro ao tentar resolver o incidente.',
                variant: 'destructive',
            });
        },
    });

    return {
        incidents,
        isLoading,
        error,
        createIncident: createMutation.mutateAsync,
        updateIncident: updateMutation.mutateAsync,
        resolveIncident: resolveMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isResolving: resolveMutation.isPending,
    };
}
