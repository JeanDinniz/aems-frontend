import apiClient from './client';
import type {
    PurchaseRequest,
    CreatePurchaseRequestData,
    ApprovalAction,
    PurchaseRequestFilters,
    ReceiveGoodsData
} from '@/types/purchase-requests.types';

export const purchaseRequestsService = {
    getAll: async (filters?: PurchaseRequestFilters, skip = 0, limit = 50) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.urgency) params.append('urgency', filters.urgency);
        if (filters?.store_id) params.append('store_id', filters.store_id.toString());
        if (filters?.requester_id) params.append('requester_id', filters.requester_id.toString());
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());

        // Using apiClient instead of accessing axios directly
        const response = await apiClient.get<{ items: PurchaseRequest[]; total: number }>(
            '/purchase-requests',
            { params: params } // passing params object or query string, apiClient usually handles object better or params prop if it's axios wrapper
        );
        // Assuming apiClient.get signature is similar to axios
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<PurchaseRequest>(`/purchase-requests/${id}`);
        return response.data;
    },

    create: async (data: CreatePurchaseRequestData) => {
        const response = await apiClient.post<PurchaseRequest>('/purchase-requests', data);
        return response.data;
    },

    supervisorApproval: async (id: number, action: ApprovalAction) => {
        const response = await apiClient.post<PurchaseRequest>(
            `/purchase-requests/${id}/supervisor-approval`,
            action
        );
        return response.data;
    },

    ownerApproval: async (id: number, action: ApprovalAction) => {
        const response = await apiClient.post<PurchaseRequest>(
            `/purchase-requests/${id}/owner-approval`,
            action
        );
        return response.data;
    },

    markOrdered: async (id: number, data: { supplier_name: string; expected_delivery: string; order_date?: string; payment_terms?: string }) => {
        const response = await apiClient.post<PurchaseRequest>(`/purchase-requests/${id}/mark-ordered`, data);
        return response.data;
    },

    receiveGoods: async (id: number, data: ReceiveGoodsData) => {
        const response = await apiClient.post<PurchaseRequest>(`/purchase-requests/${id}/mark-received`, data);
        return response.data;
    },

    markCompleted: async (id: number, notes?: string) => {
        const response = await apiClient.post<PurchaseRequest>(
            `/purchase-requests/${id}/complete`,
            { notes }
        );
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/purchase-requests/${id}`);
    },

    // Estatísticas
    getStats: async () => {
        const response = await apiClient.get('/purchase-requests/stats');
        return response.data;
    }
};
