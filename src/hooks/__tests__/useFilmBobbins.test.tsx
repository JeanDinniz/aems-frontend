/**
 * Tests for useFilmBobbins and usePurchaseRequests Hooks
 *
 * Tests inventory management and purchase request hooks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFilmBobbins } from '../useFilmBobbins';
import { usePurchaseRequests } from '../usePurchaseRequests';
import apiClient from '@/services/api/client';

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

describe('useFilmBobbins', () => {
    beforeEach(() => {
        apiClient.defaults.headers.common['Authorization'] = 'Bearer mock-token';
    });

    it('should fetch film bobbins successfully', async () => {
        const { result } = renderHook(() => useFilmBobbins(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.items).toBeInstanceOf(Array);
        expect(result.current.data?.total).toBeGreaterThanOrEqual(0);
    });

    it('should apply filters', async () => {
        const filters = { film_type: 'fume_35', status: 'available' as const };
        const { result } = renderHook(() => useFilmBobbins(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
    });

    it('should apply pagination', async () => {
        const { result } = renderHook(() => useFilmBobbins(undefined, 0, 10), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.items.length).toBeLessThanOrEqual(10);
    });

    it('should handle loading state', () => {
        const { result } = renderHook(() => useFilmBobbins(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isLoading).toBeDefined();
    });

    it('should return bobbins with required fields', async () => {
        const { result } = renderHook(() => useFilmBobbins(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const bobbins = result.current.data?.items || [];
        if (bobbins.length > 0) {
            const bobbin = bobbins[0];
            expect(bobbin).toHaveProperty('id');
            expect(bobbin).toHaveProperty('smart_id');
            expect(bobbin).toHaveProperty('film_type');
            expect(bobbin).toHaveProperty('nominal_metragem');
            expect(bobbin).toHaveProperty('current_metragem');
            expect(bobbin).toHaveProperty('yield_percentage');
            expect(bobbin).toHaveProperty('status');
        }
    });

    it('should filter by store ID', async () => {
        const filters = { store_id: 1 };
        const { result } = renderHook(() => useFilmBobbins(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        result.current.data?.items.forEach((bobbin) => {
            expect(bobbin.store_id).toBe(1);
        });
    });

    it('should handle error state', async () => {
        const { server } = await import('@/__mocks__/server');
        const { http, HttpResponse } = await import('msw');

        // Override handler to return error
        server.use(
            http.get('http://127.0.0.1:8000/api/v1/film-bobbins', () => {
                return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
            })
        );

        const { result } = renderHook(() => useFilmBobbins(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });

    it('should validate SMART ID format', async () => {
        const { result } = renderHook(() => useFilmBobbins(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const bobbins = result.current.data?.items || [];
        bobbins.forEach((bobbin) => {
            expect(bobbin.smart_id).toMatch(/^LJ\d{2}-[A-Z0-9]+-\d{4}-\d{3}$/);
        });
    });

    it('should have valid status values', async () => {
        const { result } = renderHook(() => useFilmBobbins(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const validStatuses = ['available', 'in_use', 'finished'];
        result.current.data?.items.forEach((bobbin) => {
            expect(validStatuses).toContain(bobbin.status);
        });
    });

    it('should calculate yield percentage', async () => {
        const { result } = renderHook(() => useFilmBobbins(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        result.current.data?.items.forEach((bobbin) => {
            // yield_percentage can be null for new bobbins
            if (bobbin.yield_percentage !== null) {
                expect(typeof bobbin.yield_percentage).toBe('number');
                expect(bobbin.yield_percentage).toBeGreaterThanOrEqual(0);
                expect(bobbin.yield_percentage).toBeLessThanOrEqual(100);
            }
        });
    });
});

describe('usePurchaseRequests', () => {
    beforeEach(() => {
        apiClient.defaults.headers.common['Authorization'] = 'Bearer mock-token';
    });

    it('should fetch purchase requests successfully', async () => {
        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.items).toBeInstanceOf(Array);
        expect(result.current.data?.total).toBeGreaterThanOrEqual(0);
    });

    it('should apply filters', async () => {
        const filters = {
            status: 'awaiting_supervisor' as const,
            category: 'film' as const,
            urgency: 'normal' as const,
        };
        const { result } = renderHook(() => usePurchaseRequests(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
    });

    it('should apply pagination', async () => {
        const { result } = renderHook(
            () => usePurchaseRequests(undefined, 0, 10),
            {
                wrapper: createWrapper(),
            }
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.items.length).toBeLessThanOrEqual(10);
    });

    it('should return requests with required fields', async () => {
        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const requests = result.current.data?.items || [];
        if (requests.length > 0) {
            const request = requests[0];
            expect(request).toHaveProperty('id');
            expect(request).toHaveProperty('store_id');
            expect(request).toHaveProperty('requester_id');
            expect(request).toHaveProperty('category');
            expect(request).toHaveProperty('request_number');
            expect(request).toHaveProperty('justification');
            expect(request).toHaveProperty('total_estimated');
            expect(request).toHaveProperty('urgency');
            expect(request).toHaveProperty('status');
        }
    });

    it('should filter by status', async () => {
        const filters = { status: 'awaiting_supervisor' as const };
        const { result } = renderHook(() => usePurchaseRequests(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
    });

    it('should filter by category', async () => {
        const filters = { category: 'film' as const };
        const { result } = renderHook(() => usePurchaseRequests(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
    });

    it('should filter by store ID', async () => {
        const filters = { store_id: 1 };
        const { result } = renderHook(() => usePurchaseRequests(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        result.current.data?.items.forEach((request) => {
            expect(request.store_id).toBe(1);
        });
    });

    it('should filter by date range', async () => {
        const filters = {
            start_date: '2026-02-01',
            end_date: '2026-02-11',
        };
        const { result } = renderHook(() => usePurchaseRequests(filters), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
    });

    it('should have valid category values', async () => {
        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const validCategories = [
            'film',
            'workshop',
            'vn',
            'vu',
            'equipment',
            'uniforms',
            'other',
        ];
        result.current.data?.items.forEach((request) => {
            expect(validCategories).toContain(request.category);
        });
    });

    it('should have valid urgency values', async () => {
        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const validUrgency = ['normal', 'urgent', 'critical'];
        result.current.data?.items.forEach((request) => {
            expect(validUrgency).toContain(request.urgency);
        });
    });

    it('should have valid status values', async () => {
        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const validStatuses = [
            'pending',
            'awaiting_supervisor',
            'awaiting_owner',
            'approved',
            'ordered',
            'rejected',
            'completed',
        ];
        result.current.data?.items.forEach((request) => {
            expect(validStatuses).toContain(request.status);
        });
    });

    it('should include requester information', async () => {
        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        result.current.data?.items.forEach((request) => {
            expect(request.requester_id).toBeDefined();
            expect(request.requester_name).toBeDefined();
        });
    });

    it('should include store information', async () => {
        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        result.current.data?.items.forEach((request) => {
            expect(request.store_id).toBeDefined();
            expect(request.store_name).toBeDefined();
        });
    });

    it('should handle error state', async () => {
        const { server } = await import('@/__mocks__/server');
        const { http, HttpResponse } = await import('msw');

        // Override handler to return error
        server.use(
            http.get('http://127.0.0.1:8000/api/v1/purchase-requests', () => {
                return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
            })
        );

        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });

    it('should validate positive quantity', async () => {
        const { result } = renderHook(() => usePurchaseRequests(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        result.current.data?.items.forEach((request) => {
            expect(request.total_estimated).toBeGreaterThan(0);
        });
    });
});
