import apiClient from './client';
import type { FilmBobbin, CreateFilmBobbinData, FilmBobbinFilters, FilmConsumption } from '@/types/inventory.types';

export const filmBobbinsService = {
    getAll: async (filters?: FilmBobbinFilters, skip = 0, limit = 50) => {
        const params = new URLSearchParams();
        if (filters?.film_type && filters.film_type !== 'all') params.append('film_type', filters.film_type);
        if (filters?.status && (filters.status as string) !== 'all') params.append('status', filters.status);
        if (filters?.store_id) params.append('store_id', filters.store_id.toString());
        if (filters?.search) params.append('search', filters.search);
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get<{ items: FilmBobbin[]; total: number }>(
            `/inventory/film-reels?${params.toString()}`
        );
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<FilmBobbin>(`/inventory/film-reels/${id}`);
        return response.data;
    },

    create: async (data: CreateFilmBobbinData) => {
        const response = await apiClient.post<FilmBobbin>('/inventory/film-reels', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CreateFilmBobbinData>) => {
        const response = await apiClient.put<FilmBobbin>(`/inventory/film-reels/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/inventory/film-reels/${id}`);
    },

    registerConsumption: async (id: number, consumption: FilmConsumption) => {
        const response = await apiClient.post<FilmBobbin>(
            `/inventory/film-reels/${id}/use`,
            consumption
        );
        return response.data;
    },

    getConsumptionHistory: async (id: number) => {
        const response = await apiClient.get(`/inventory/film-reels/${id}/use-history`);
        return response.data;
    },

    getAlerts: async (storeId?: number) => {
        const params = storeId ? `?store_id=${storeId}` : '';
        const response = await apiClient.get(`/inventory/film-reels/alerts/low-yield${params}`);
        return response.data;
    },

    getYieldStats: async (storeId: number) => {
        const response = await apiClient.get(`/inventory/film-reels/stats/${storeId}`);
        return response.data;
    }
};
