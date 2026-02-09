import { apiClient } from './client';
import type {
    Occurrence,
    OccurrenceFilters,
    OccurrenceListResponse,
    CreateOccurrenceDTO,
    UpdateOccurrenceDTO,
    AcknowledgeOccurrenceDTO
} from '@/types/occurrence.types';

export const occurrencesService = {
    /**
     * Lista ocorrências com filtros
     */
    async list(filters?: OccurrenceFilters): Promise<OccurrenceListResponse> {
        const { data } = await apiClient.get('/hr/occurrences', {
            params: filters
        });
        return data;
    },

    /**
     * Busca uma ocorrência por ID
     */
    async getById(id: number): Promise<Occurrence> {
        const { data } = await apiClient.get(`/hr/occurrences/${id}`);
        return data;
    },

    /**
     * Cria uma nova ocorrência
     */
    async create(payload: CreateOccurrenceDTO): Promise<Occurrence> {
        const { data } = await apiClient.post('/hr/occurrences', payload);
        return data;
    },

    /**
     * Atualiza uma ocorrência existente
     */
    async update(id: number, payload: UpdateOccurrenceDTO): Promise<Occurrence> {
        const { data } = await apiClient.patch(`/hr/occurrences/${id}`, payload);
        return data;
    },

    /**
     * Funcionário reconhece uma ocorrência
     */
    async acknowledge(id: number, payload: AcknowledgeOccurrenceDTO): Promise<Occurrence> {
        const { data } = await apiClient.post(`/hr/occurrences/${id}/acknowledge`, payload);
        return data;
    },

    /**
     * Busca todas as ocorrências de um funcionário
     */
    async getByEmployee(employeeId: number, skip = 0, limit = 100): Promise<OccurrenceListResponse> {
        const { data } = await apiClient.get(`/hr/occurrences/employee/${employeeId}`, {
            params: { skip, limit }
        });
        return data;
    }
};
