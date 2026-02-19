import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOccurrences } from './useOccurrences';
import { occurrencesService } from '@/services/api/occurrences.service';
import { OccurrenceType } from '@/types/occurrence.types';
import type { Occurrence, OccurrenceFilters } from '@/types/occurrence.types';

vi.mock('@/services/api/occurrences.service');
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client= { queryClient } > { children } </QueryClientProvider>
  );
};

describe('useOccurrences', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch occurrences with filters', async () => {
        const mockData = {
            occurrences: [] as Occurrence[],
            total: 0,
            skip: 0,
            limit: 10,
        };

        vi.mocked(occurrencesService.list).mockResolvedValue(mockData);

        const filters: OccurrenceFilters = {
            occurrence_type: OccurrenceType.ABSENCE,
        };

        const { result } = renderHook(() => useOccurrences(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(occurrencesService.list).toHaveBeenCalledWith(filters);
        expect(result.current.occurrences).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('should return empty array when no filters', () => {
        const { result } = renderHook(() => useOccurrences(), {
            wrapper: createWrapper(),
        });

        expect(result.current.occurrences).toEqual([]);
    });
});
