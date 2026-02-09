import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/api/dashboard.service';
import type { DashboardFilters } from '@/types/dashboard.types';

export function useDashboardData(filters?: DashboardFilters) {
    return useQuery({
        queryKey: ['dashboard', filters],
        queryFn: () => dashboardService.getData(filters),
        refetchInterval: 60000, // Atualiza a cada 1 min
        staleTime: 30000,
    });
}
