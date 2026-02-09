import { apiClient } from './client';

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
}

export const storesService = {
    async list(): Promise<Store[]> {
        const response = await apiClient.get<{ items: Store[] }>('/stores');
        return response.data.items || [];
    },
};
