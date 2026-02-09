import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/api/reports.service';
import type { DashboardFilters } from '@/types/reports.types';

export function useDashboard(filters: DashboardFilters) {
    return useQuery({
        queryKey: ['dashboard', filters],
        queryFn: () => reportsService.getDashboard(filters),
        enabled: !!filters.start_date && !!filters.end_date,
    });
}
