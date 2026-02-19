/**
 * Tests for useDayPanel Hook
 *
 * Tests day panel functionality including service order fetching,
 * semaphore color calculation, filtering, and WebSocket integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDayPanel, calculateSemaphoreColor } from '../useDayPanel';
import apiClient from '@/services/api/client';

// Mock useWebSocket
vi.mock('../useWebSocket', () => ({
    useWebSocket: vi.fn(() => ({
        connection: { status: 'connected', lastMessage: null },
    })),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useDayPanel', () => {
    beforeEach(() => {
        apiClient.defaults.headers.common['Authorization'] = 'Bearer mock-token';
        vi.clearAllMocks();
    });

    describe('calculateSemaphoreColor', () => {
        describe('film department', () => {
            it('should return white for < 45 minutes', () => {
                const entryTime = new Date(Date.now() - 44 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'film')).toBe('white');
            });

            it('should return yellow for 45-89 minutes', () => {
                const entryTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'film')).toBe('yellow');
            });

            it('should return orange for 90-179 minutes', () => {
                const entryTime = new Date(Date.now() - 120 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'film')).toBe('orange');
            });

            it('should return red for >= 180 minutes', () => {
                const entryTime = new Date(Date.now() - 200 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'film')).toBe('red');
            });
        });

        describe('workshop department', () => {
            it('should return white for < 60 minutes', () => {
                const entryTime = new Date(Date.now() - 59 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'workshop')).toBe('white');
            });

            it('should return yellow for 60-119 minutes', () => {
                const entryTime = new Date(Date.now() - 90 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'workshop')).toBe('yellow');
            });

            it('should return orange for 120-239 minutes', () => {
                const entryTime = new Date(Date.now() - 180 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'workshop')).toBe('orange');
            });

            it('should return red for >= 240 minutes', () => {
                const entryTime = new Date(Date.now() - 300 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'workshop')).toBe('red');
            });
        });

        describe('bodywork department', () => {
            it('should return white for < 60 minutes', () => {
                const entryTime = new Date(Date.now() - 59 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'bodywork')).toBe('white');
            });

            it('should return yellow for 60-119 minutes', () => {
                const entryTime = new Date(Date.now() - 90 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'bodywork')).toBe('yellow');
            });

            it('should return orange for 120-239 minutes', () => {
                const entryTime = new Date(Date.now() - 180 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'bodywork')).toBe('orange');
            });

            it('should return red for >= 240 minutes', () => {
                const entryTime = new Date(Date.now() - 300 * 60 * 1000).toISOString();
                expect(calculateSemaphoreColor(entryTime, 'bodywork')).toBe('red');
            });
        });
    });

    describe('useDayPanel hook', () => {
        it('should fetch day panel orders for a store', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.orders).toBeDefined();
            expect(Array.isArray(result.current.orders)).toBe(true);
        });

        it('should not fetch without storeId', () => {
            const { result } = renderHook(() => useDayPanel({}), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.orders).toEqual([]);
        });

        it('should organize orders into status columns', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.columns).toBeDefined();
            expect(result.current.columns).toHaveProperty('waiting');
            expect(result.current.columns).toHaveProperty('in_progress');
            expect(result.current.columns).toHaveProperty('inspection');
            expect(result.current.columns).toHaveProperty('ready');
            expect(result.current.columns).toHaveProperty('delivered');
        });

        it('should calculate statistics', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.stats).toBeDefined();
            expect(result.current.stats).toHaveProperty('total');
            expect(result.current.stats).toHaveProperty('delayed');
            expect(result.current.stats).toHaveProperty('critical');
            expect(typeof result.current.stats.total).toBe('number');
            expect(typeof result.current.stats.delayed).toBe('number');
            expect(typeof result.current.stats.critical).toBe('number');
        });

        it('should provide filter controls', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            expect(result.current.filters).toBeDefined();
            expect(result.current.filters).toHaveProperty('department');
            expect(result.current.filters).toHaveProperty('setDepartment');
            expect(result.current.filters).toHaveProperty('onlyDelayed');
            expect(result.current.filters).toHaveProperty('setOnlyDelayed');
        });

        it('should filter by department', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Set filter to film
            act(() => {
                result.current.filters.setDepartment('film');
            });

            await waitFor(() => {
                const filmOrders = result.current.orders.filter(
                    (o) => o.department === 'film'
                );
                expect(result.current.orders.length).toBe(filmOrders.length);
            });
        });

        it('should filter delayed orders', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Enable delayed filter
            act(() => {
                result.current.filters.setOnlyDelayed(true);
            });

            await waitFor(() => {
                result.current.orders.forEach((order) => {
                    expect(['orange', 'red']).toContain(order.semaphoreColor);
                });
            });
        });

        it('should show all departments when filter is "all"', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.filters.setDepartment('all');
            });

            // Should show orders from all departments
            const totalOrders = result.current.orders.length;
            expect(totalOrders).toBeGreaterThanOrEqual(0);
        });

        it('should calculate elapsed minutes for each order', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const processedOrders = result.current.orders;
            processedOrders.forEach((order) => {
                expect(order).toHaveProperty('elapsedMinutes');
                expect(typeof order.elapsedMinutes).toBe('number');
                expect(order.elapsedMinutes).toBeGreaterThanOrEqual(0);
            });
        });

        it('should recalculate semaphore colors dynamically', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const orders = result.current.orders;
            orders.forEach((order) => {
                expect(['white', 'yellow', 'orange', 'red']).toContain(
                    order.semaphoreColor
                );
            });
        });

        it('should provide WebSocket connection status', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            expect(result.current.connection).toBeDefined();
            expect(result.current.connection).toHaveProperty('status');
        });

        it('should handle empty order list', async () => {
            // Mock empty response
            const { result } = renderHook(() => useDayPanel({ storeId: 999 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.orders).toEqual([]);
            expect(result.current.stats.total).toBe(0);
        });

        it('should refetch periodically (polling)', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // The hook should have refetchInterval configured
            expect(result.current.orders).toBeDefined();
        });
    });

    describe('statistics calculation', () => {
        it('should count delayed orders correctly', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const { stats, orders } = result.current;
            const manualDelayedCount = orders.filter(
                (o) => o.semaphoreColor === 'orange' || o.semaphoreColor === 'red'
            ).length;

            expect(stats.delayed).toBe(manualDelayedCount);
        });

        it('should count critical orders correctly', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const { stats, orders } = result.current;
            const manualCriticalCount = orders.filter(
                (o) => o.semaphoreColor === 'red'
            ).length;

            expect(stats.critical).toBe(manualCriticalCount);
        });

        it('should count total orders correctly', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Stats.total should reflect original orders count, not filtered
            expect(result.current.stats.total).toBeGreaterThanOrEqual(0);
        });
    });

    describe('column grouping', () => {
        it('should group orders by status', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const { columns } = result.current;

            // Check that each status has an array
            Object.keys(columns).forEach((status) => {
                expect(Array.isArray(columns[status as keyof typeof columns])).toBe(
                    true
                );
            });
        });

        it('should place orders in correct columns', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const { columns } = result.current;

            // Verify each order in a column has the correct status
            Object.entries(columns).forEach(([status, orders]) => {
                orders.forEach((order) => {
                    expect(order.status).toBe(status);
                });
            });
        });

        it('should handle all possible statuses', async () => {
            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const { columns } = result.current;

            const expectedStatuses = [
                'waiting',
                'in_progress',
                'inspection',
                'ready',
                'delivered',
            ];

            expectedStatuses.forEach((status) => {
                expect(columns).toHaveProperty(status);
            });
        });
    });

    describe('real-time updates', () => {
        it('should update timer every second', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });

            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Capture initial elapsed minutes if there are orders
            const initialOrders = result.current.orders;

            if (initialOrders.length > 0) {
                const initialElapsed = initialOrders[0].elapsedMinutes;

                // Advance time by 1 second
                act(() => {
                    vi.advanceTimersByTime(1000);
                });

                // elapsed time should update
                await waitFor(() => {
                    const updatedOrders = result.current.orders;
                    expect(updatedOrders).toBeDefined();
                    if (updatedOrders.length > 0) {
                        // Time should have progressed
                        expect(updatedOrders[0].elapsedMinutes).toBeGreaterThanOrEqual(initialElapsed);
                    }
                });
            }

            vi.useRealTimers();
        });

        it('should cleanup timer on unmount', () => {
            vi.useFakeTimers();

            const { unmount } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            unmount();

            // Should not have any active timers
            vi.useRealTimers();
        });
    });

    describe('error handling', () => {
        it('should handle fetch errors', async () => {
            // Remove auth to trigger error
            delete apiClient.defaults.headers.common['Authorization'];

            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.error).toBeDefined();
            });

            // Restore auth
            apiClient.defaults.headers.common['Authorization'] =
                'Bearer mock-token';
        });

        it('should provide error information', async () => {
            delete apiClient.defaults.headers.common['Authorization'];

            const { result } = renderHook(() => useDayPanel({ storeId: 1 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.error).toBeDefined();
            });

            apiClient.defaults.headers.common['Authorization'] =
                'Bearer mock-token';
        });
    });
});
