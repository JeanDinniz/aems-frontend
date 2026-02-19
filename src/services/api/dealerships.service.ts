import { apiClient } from './client';
import type { Dealership, DealershipFilters } from '@/types/dealership.types';

export const dealershipsService = {
    async list(filters?: DealershipFilters): Promise<Dealership[]> {
        const params = new URLSearchParams();
        if (filters?.store_id) params.append('store_id', filters.store_id.toString());
        if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

        const queryString = params.toString();
        const url = queryString ? `/dealerships?${queryString}` : '/dealerships';

        const response = await apiClient.get<{ items: Dealership[] }>(url);
        return response.data.items || [];
    },

    async getById(id: number): Promise<Dealership> {
        const response = await apiClient.get<Dealership>(`/dealerships/${id}`);
        return response.data;
    },
};
