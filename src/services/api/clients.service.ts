import { apiClient } from './client';
import type {
    Client,
    CreateClientData,
    ClientFilters,
    ClientStats,
    Vehicle,
    CreateVehicleData
} from '@/types/client.types';

export const clientsService = {
    // Clientes
    getAll: async (filters?: ClientFilters, skip = 0, limit = 50) => {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.city) params.append('city', filters.city);
        if (filters?.has_vehicles !== undefined) {
            params.append('has_vehicles', filters.has_vehicles.toString());
        }
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get<{ items: Client[]; total: number }>(
            `/clients?${params.toString()}`
        );
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<Client>(`/clients/${id}`);
        return response.data;
    },

    create: async (data: CreateClientData) => {
        const response = await apiClient.post<Client>('/clients', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CreateClientData>) => {
        const response = await apiClient.put<Client>(`/clients/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/clients/${id}`);
    },

    getStats: async (id: number) => {
        const response = await apiClient.get<ClientStats>(`/clients/${id}/stats`);
        return response.data;
    },

    // Veículos
    getVehicles: async (clientId: number) => {
        const response = await apiClient.get<Vehicle[]>(`/clients/${clientId}/vehicles`);
        return response.data;
    },

    createVehicle: async (data: CreateVehicleData) => {
        const response = await apiClient.post<Vehicle>('/vehicles', data);
        return response.data;
    },

    updateVehicle: async (id: number, data: Partial<CreateVehicleData>) => {
        const response = await apiClient.put<Vehicle>(`/vehicles/${id}`, data);
        return response.data;
    },

    deleteVehicle: async (id: number) => {
        await apiClient.delete(`/vehicles/${id}`);
    },

    // Histórico de Serviços
    getServiceHistory: async (clientId: number) => {
        const response = await apiClient.get(`/clients/${clientId}/service-history`);
        return response.data;
    }
};
