import { useQuery } from '@tanstack/react-query';
import { occurrencesService } from '@/services/api/occurrences.service';

export function useEmployeeOccurrences(employeeId: number | undefined, skip = 0, limit = 100) {
    return useQuery({
        queryKey: ['employee-occurrences', employeeId, skip, limit],
        queryFn: () => occurrencesService.getByEmployee(employeeId!, skip, limit),
        enabled: !!employeeId,
    });
}
