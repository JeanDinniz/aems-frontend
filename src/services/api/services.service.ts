import apiClient from './client';

export interface ServiceItem {
    id: number;
    name: string;
    description: string | null;
    department: string;
    base_price: number;
    is_active: boolean;
    available_for_all_departments: boolean;
    brand?: string | null;
    code?: string | null;
    category?: string | null;
    created_at?: string;
    updated_at?: string | null;
}

const SERVICE_ORDER: string[] = [
    'Lavagem Cortesia',
    'Lavagem + Aspiração',
    'Lavagem + Aspiração + Motor',
    'Enceramento',
    'Polimento',
    'Higienização Interna',
    'Impermeabilização Do Estofado',
    'Hidratação',
    'Vitrificação - Pintura',
    'Vitrificação - Banco de Couro',
    'VIP-CAR',
];

export interface ServiceListParams {
    department?: string;
    brand?: string;
    is_active?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
}

export interface ServiceListResponse {
    items: ServiceItem[];
    total: number;
}

export const servicesService = {
    getAll: async (): Promise<ServiceItem[]> => {
        const response = await apiClient.get('/services', {
            params: { limit: 500 },
        });
        const items: ServiceItem[] = response.data.items;
        return items.sort((a, b) => {
            const indexA = SERVICE_ORDER.indexOf(a.name);
            const indexB = SERVICE_ORDER.indexOf(b.name);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
    },

    list: async (params?: ServiceListParams): Promise<ServiceListResponse> => {
        const queryParams: Record<string, string | number | boolean> = {
            limit: params?.limit ?? 200,
            skip: params?.skip ?? 0,
        };
        if (params?.department) queryParams.department = params.department;
        if (params?.brand) queryParams.brand = params.brand;
        if (params?.is_active !== undefined) queryParams.is_active = params.is_active;
        if (params?.search) queryParams.search = params.search;

        const response = await apiClient.get('/services', { params: queryParams });
        return {
            items: response.data.items ?? [],
            total: response.data.total ?? 0,
        };
    },

    create: async (payload: {
        name: string;
        department: string;
        base_price: number;
        brand?: string | null;
        code?: string | null;
        category?: string | null;
        available_for_all_departments?: boolean;
    }): Promise<ServiceItem> => {
        const response = await apiClient.post('/services', payload);
        return response.data;
    },

    update: async (id: number, payload: {
        name?: string;
        department?: string;
        base_price?: number;
        brand?: string | null;
        code?: string | null;
        category?: string | null;
        available_for_all_departments?: boolean;
    }): Promise<ServiceItem> => {
        const response = await apiClient.patch(`/services/${id}`, payload);
        return response.data;
    },

    deactivate: async (id: number): Promise<void> => {
        await apiClient.delete(`/services/${id}`);
    },
};
