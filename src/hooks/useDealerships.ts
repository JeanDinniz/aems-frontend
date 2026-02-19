import { useQuery } from '@tanstack/react-query';
import { dealershipsService } from '@/services/api/dealerships.service';
import type { DealershipFilters } from '@/types/dealership.types';

export function useDealerships(filters?: DealershipFilters) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['dealerships', filters],
        queryFn: () => dealershipsService.list(filters),
    });

    return {
        dealerships: data || [],
        isLoading,
        error,
    };
}
