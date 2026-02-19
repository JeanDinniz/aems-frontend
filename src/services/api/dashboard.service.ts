import { apiClient } from './client';
import type { DashboardData, DashboardFilters } from '@/types/dashboard.types';

export const dashboardService = {
    async getData(filters?: DashboardFilters): Promise<DashboardData> {
        const params = new URLSearchParams();
        if (filters?.period) params.append('period', filters.period);
        if (filters?.storeId) params.append('store_id', filters.storeId.toString());
        if (filters?.department) params.append('department', filters.department);

        const response = await apiClient.get<DashboardData>(`/reports/dashboard?${params.toString()}`);
        return response.data;
    },

    async exportReport(filters?: DashboardFilters): Promise<Blob> {
        const params = new URLSearchParams();
        if (filters?.period) params.append('period', filters.period);
        if (filters?.storeId) params.append('store_id', filters.storeId.toString());

        const response = await apiClient.get(`/reports/dashboard/export?${params.toString()}`, {
            responseType: 'blob',
        });
        return response.data as Blob;
    },
};
