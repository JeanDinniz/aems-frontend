import apiClient from './client';
import type { ServiceOrder, CreateServiceOrderData, ServiceOrderFilters } from '@/types/service-order.types';

import type { ServiceOrderCard } from '@/types/day-panel.types';

export const serviceOrdersService = {
    getDayPanel: async (storeId?: number, date?: string): Promise<ServiceOrderCard[]> => {
        const { data } = await apiClient.get('/service-orders/day-panel', {
            params: { store_id: storeId, date },
        });
        return data;
    },

    getAll: async (filters?: ServiceOrderFilters, skip = 0, limit = 20) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.location_id) params.append('location_id', filters.location_id.toString());
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        if (filters?.search) params.append('search', filters.search);
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get<{ items: ServiceOrder[]; total: number }>(
            `/service-orders?${params.toString()}`
        );
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<ServiceOrder>(`/service-orders/${id}`);
        return response.data;
    },

    create: async (data: CreateServiceOrderData) => {
        const response = await apiClient.post<ServiceOrder>('/service-orders', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CreateServiceOrderData>) => {
        const response = await apiClient.patch<ServiceOrder>(`/service-orders/${id}`, data);
        return response.data;
    },

    updateStatus: async (id: number, status: string, extras?: { worker_ids?: number[]; primary_worker_id?: number }) => {
        const response = await apiClient.patch<ServiceOrder>(
            `/service-orders/${id}/status`,
            { status, ...extras }
        );
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/service-orders/${id}`);
    }
};
