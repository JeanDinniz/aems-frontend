import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from '@/services/api/reports.service';
import type { CreateQualityAuditDTO } from '@/types/reports.types';
import { useToast } from '@/hooks/use-toast';

export function useQualityAudits(params?: {
    store_id?: number;
    start_date?: string;
    end_date?: string;
}) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data, isLoading, error } = useQuery({
        queryKey: ['quality-audits', params],
        queryFn: () => reportsService.listQualityAudits(params),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateQualityAuditDTO) => reportsService.createQualityAudit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quality-audits'] });
            toast({
                title: 'Auditoria criada',
                description: 'A auditoria de qualidade foi registrada com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao criar auditoria',
                description: error.response?.data?.message || 'Ocorreu um erro.',
                variant: 'destructive',
            });
        },
    });

    return {
        audits: data?.audits || [],
        total: data?.total || 0,
        isLoading,
        error,
        createAudit: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
    };
}
