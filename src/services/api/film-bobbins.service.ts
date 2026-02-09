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
            `/film-bobbins?${params.toString()}`
        );
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<FilmBobbin>(`/film-bobbins/${id}`);
        return response.data;
    },

    create: async (data: CreateFilmBobbinData) => {
        const response = await apiClient.post<FilmBobbin>('/film-bobbins', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CreateFilmBobbinData>) => {
        const response = await apiClient.put<FilmBobbin>(`/film-bobbins/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/film-bobbins/${id}`);
    },

    registerConsumption: async (id: number, consumption: FilmConsumption) => {
        const response = await apiClient.post<FilmBobbin>(
            `/film-bobbins/${id}/consume`,
            consumption
        );
        return response.data;
    },

    getConsumptionHistory: async (id: number) => {
        const response = await apiClient.get(`/film-bobbins/${id}/consumption-history`);
        return response.data;
    },

    getAlerts: async (storeId?: number) => {
        const params = storeId ? `?store_id=${storeId}` : '';
        const response = await apiClient.get(`/film-bobbins/alerts${params}`);
        return response.data; // Expecting { alerts: BobbinAlert[] } or BobbinAlert[]
    },

    getYieldStats: async (bobbinId: number) => {
        const response = await apiClient.get(`/film-bobbins/${bobbinId}/yield-stats`);
        return response.data;
    }
};
