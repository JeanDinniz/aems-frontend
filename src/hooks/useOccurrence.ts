import { useQuery } from '@tanstack/react-query';
import { occurrencesService } from '@/services/api/occurrences.service';

export function useOccurrence(id: number | undefined) {
    return useQuery({
        queryKey: ['occurrence', id],
        queryFn: () => occurrencesService.getById(id!),
        enabled: !!id,
    });
}
