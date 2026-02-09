import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/api/reports.service';
import type { RankingFilters } from '@/types/reports.types';

export function useWorkerRanking(filters: RankingFilters) {
    return useQuery({
        queryKey: ['worker-ranking', filters],
        queryFn: () => reportsService.getWorkerRanking(filters),
        enabled: !!filters.start_date && !!filters.end_date,
    });
}
