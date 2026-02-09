import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from '@/services/api/reports.service';
import type { CreateMonthlyGoalDTO } from '@/types/reports.types';
import { useToast } from '@/hooks/use-toast';

export function useMonthlyGoals(params?: {
    store_id?: number;
    year_month?: string;
}) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data, isLoading, error } = useQuery({
        queryKey: ['monthly-goals', params],
        queryFn: () => reportsService.listMonthlyGoals(params),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateMonthlyGoalDTO) => reportsService.createMonthlyGoal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monthly-goals'] });
            toast({
                title: 'Meta criada',
                description: 'A meta mensal foi definida com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao criar meta',
                description: error.response?.data?.message || 'Ocorreu um erro.',
                variant: 'destructive',
            });
        },
    });

    return {
        goals: data?.goals || [],
        total: data?.total || 0,
        isLoading,
        error,
        createGoal: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
    };
}
