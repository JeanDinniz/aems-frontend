import apiClient from './client';

export interface Store {
    id: number;
    name: string;
    code: string;
    city: string;
    state: string;
    address?: string;
    phone?: string;
    active: boolean;
    isActive?: boolean; // For compatibility if API returns different casing or for frontend logic
    store_type: 'dealership' | 'warehouse';
    dealership_id?: number | null; // For dealership stores
    dealership_brand?: string | null; // 'byd' | 'fiat' | 'hyundai' | 'toyota' | null
}

export interface CreateStorePayload {
    name: string;
    code: string;
    store_type: 'dealership' | 'warehouse';
    dealership_brand?: string | null;
    address?: string | null;
    phone?: string | null;
}

export interface UpdateStorePayload {
    name?: string;
    store_type?: 'dealership' | 'warehouse';
    active?: boolean;
    city?: string;
    state?: string;
    address?: string;
    phone?: string;
}

export const storesService = {
    async list(): Promise<Store[]> {
        const response = await apiClient.get<{ items: Store[] }>('/stores');
        return response.data.items || [];
    },

    async getById(id: number): Promise<Store> {
        const response = await apiClient.get<Store>(`/stores/${id}`);
        return response.data;
    },

    async create(data: CreateStorePayload): Promise<Store> {
        const response = await apiClient.post<Store>('/stores', data);
        return response.data;
    },

    async update(id: number, data: UpdateStorePayload): Promise<Store> {
        const response = await apiClient.patch<Store>(`/stores/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<Store> {
        const response = await apiClient.delete<Store>(`/stores/${id}`);
        return response.data;
    },
};
