import { apiClient } from './client';
import type {
    User,
    CreateUserPayload,
    UpdateUserPayload,
    UserFilters,
    UsersListResponse,
} from '@/types/user.types';

export const usersService = {
    async list(filters?: UserFilters, page = 1, pageSize = 20): Promise<UsersListResponse> {
        const params = new URLSearchParams();
        if (filters?.role) params.append('role', filters.role);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.storeId) params.append('store_id', filters.storeId.toString());
        if (filters?.search) params.append('search', filters.search);
        params.append('page', page.toString());
        params.append('page_size', pageSize.toString());

        const response = await apiClient.get<UsersListResponse>(`/users?${params.toString()}`);
        return response.data;
    },

    async getById(id: number): Promise<User> {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    async create(payload: CreateUserPayload): Promise<User> {
        const response = await apiClient.post<User>('/users', payload);
        return response.data;
    },

    async update(id: number, payload: UpdateUserPayload): Promise<User> {
        const response = await apiClient.patch<User>(`/users/${id}`, payload);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await apiClient.delete(`/users/${id}`);
    },

    async activate(id: number): Promise<User> {
        const response = await apiClient.post<User>(`/users/${id}/activate`);
        return response.data;
    },

    async deactivate(id: number): Promise<User> {
        const response = await apiClient.post<User>(`/users/${id}/deactivate`);
        return response.data;
    },

    async resetPassword(id: number): Promise<{ temporaryPassword: string }> {
        const response = await apiClient.post<{ temporaryPassword: string }>(`/users/${id}/reset-password`);
        return response.data;
    },

    async bulkActivate(ids: number[]): Promise<void> {
        await apiClient.post('/users/bulk-activate', { ids });
    },

    async bulkDeactivate(ids: number[]): Promise<void> {
        await apiClient.post('/users/bulk-deactivate', { ids });
    },

    async export(filters?: UserFilters): Promise<Blob> {
        const params = new URLSearchParams();
        if (filters?.role) params.append('role', filters.role);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.storeId) params.append('store_id', filters.storeId.toString());
        if (filters?.search) params.append('search', filters.search);

        const response = await apiClient.get(`/users/export?${params.toString()}`, {
            responseType: 'blob',
        });
        return response.data as Blob;
    },
};
