import { apiClient } from './client'

export interface VehicleModelItem {
    id: number
    store_id: number
    name: string
    brand: string | null
    is_active: boolean
    created_at: string
    updated_at: string | null
}

interface VehicleModelListResponse {
    items: VehicleModelItem[]
    pagination: object
}

export const vehicleModelsService = {
    list: async (params: { store_id?: number; active_only?: boolean; limit?: number } = {}): Promise<VehicleModelItem[]> => {
        const response = await apiClient.get<VehicleModelListResponse>('/vehicle-models', { params: { limit: 200, ...params } })
        return response.data.items
    },
    create: async (store_id: number, data: { name: string; brand?: string }): Promise<VehicleModelItem> => {
        const response = await apiClient.post<VehicleModelItem>('/vehicle-models', data, { params: { store_id } })
        return response.data
    },
    update: async (id: number, store_id: number, data: { name?: string; brand?: string; is_active?: boolean }): Promise<VehicleModelItem> => {
        const response = await apiClient.patch<VehicleModelItem>(`/vehicle-models/${id}`, data, { params: { store_id } })
        return response.data
    },
    deactivate: async (id: number, store_id: number): Promise<VehicleModelItem> => {
        const response = await apiClient.delete<VehicleModelItem>(`/vehicle-models/${id}`, { params: { store_id } })
        return response.data
    },
}
