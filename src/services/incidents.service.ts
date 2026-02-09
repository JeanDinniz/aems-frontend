import { apiClient } from './api/client';
import {
    Incident,
    IncidentFilters,
    CreateIncidentDTO,
    UpdateIncidentDTO
} from '@/types/incident.types';

export const incidentsService = {
    async list(filters?: IncidentFilters): Promise<Incident[]> {
        const { data } = await apiClient.get<{ items: Incident[] }>('/incidents', { params: filters });
        return data.items || [];
    },

    async getById(id: string): Promise<Incident> {
        const { data } = await apiClient.get(`/incidents/${id}`);
        return data;
    },

    async create(payload: CreateIncidentDTO): Promise<Incident> {
        const { data } = await apiClient.post('/incidents', payload);
        return data;
    },

    async update(id: string, payload: UpdateIncidentDTO): Promise<Incident> {
        const { data } = await apiClient.patch(`/incidents/${id}`, payload);
        return data;
    },

    async getUpdates(id: string): Promise<any[]> {
        const { data } = await apiClient.get(`/incidents/${id}/updates`);
        return data;
    },

    async addCommentWithAttachments(id: string, content: string, files: File[]): Promise<any> {
        const formData = new FormData();
        formData.append('content', content);
        files.forEach((file) => formData.append('files', file));

        const { data } = await apiClient.post(`/incidents/${id}/comments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    async deleteUpdate(incidentId: string, updateId: string): Promise<void> {
        await apiClient.delete(`/incidents/${incidentId}/updates/${updateId}`);
    },

    async editUpdate(incidentId: string, updateId: string, content: string): Promise<any> {
        const { data } = await apiClient.patch(`/incidents/${incidentId}/updates/${updateId}`, { content });
        return data;
    },

    async addComment(id: string, content: string): Promise<any> {
        const { data } = await apiClient.post(`/incidents/${id}/comments`, { content });
        return data;
    },

    async resolve(id: string, resolutionNotes: string): Promise<Incident> {
        const { data } = await apiClient.post(`/incidents/${id}/resolve`, {
            resolution_notes: resolutionNotes
        });
        return data;
    }
};
