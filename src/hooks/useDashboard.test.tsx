import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard } from './useDashboard';
import { reportsService } from '@/services/api/reports.service';

vi.mock('@/services/api/reports.service');

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

describe('useDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not fetch when dates are missing (enabled guard)', () => {
        const filters = {
            start_date: '',
            end_date: '',
        };

        renderHook(() => useDashboard(filters), {
            wrapper: createWrapper(),
        });

        expect(reportsService.getDashboard).not.toHaveBeenCalled();
    });

    it('should fetch dashboard when dates are provided', async () => {
        const mockData = {
            revenue_metrics: {
                total_revenue: 50000,
                revenue_by_department: {},
                comparison_previous_period: null,
            },
            os_metrics: {
                total_os: 100,
                os_delivered_on_time_pct: 95,
                avg_completion_time_minutes: 120,
            },
            semaphore_distribution: {
                white: 50,
                yellow: 30,
                orange: 15,
                red: 5,
            },
            avg_quality_score: 92.5,
            goal_progress: [],
        };

        vi.mocked(reportsService.getDashboard).mockResolvedValue(mockData);

        const filters = {
            start_date: '2024-01-01',
            end_date: '2024-01-31',
        };

        const { result } = renderHook(() => useDashboard(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(reportsService.getDashboard).toHaveBeenCalledWith(filters);
        expect(result.current.data).toEqual(mockData);
    });
});
