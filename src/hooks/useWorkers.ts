import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/api/users.service';

interface UseWorkersParams {
    storeId?: number;
    department?: string;
    enabled?: boolean;
}

export function useWorkers({ storeId, department, enabled = true }: UseWorkersParams = {}) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['workers', storeId, department],
        queryFn: () => usersService.getWorkers(storeId, department),
        enabled: enabled && !!department, // Only fetch when department is selected
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        workers: data || [],
        isLoading,
        error,
    };
}
