import { apiClient } from './client';
import type {
    ApprovalStats,
    PendingApprovalFilters,
    PurchaseRequest
} from '@/types/purchase-requests.types';

export const approvalsService = {
    async listPending(filters?: PendingApprovalFilters): Promise<PurchaseRequest[]> {
        const params = new URLSearchParams();
        params.append('status', 'pending');
        if (filters?.storeId) params.append('store_id', filters.storeId.toString());
        if (filters?.urgency) params.append('urgency', filters.urgency);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
        if (filters?.dateTo) params.append('date_to', filters.dateTo);

        const response = await apiClient.get<{ items: PurchaseRequest[] }>(`/approvals/pending?${params.toString()}`);
        return response.data.items || [];
    },

    async getStats(): Promise<ApprovalStats> {
        const response = await apiClient.get<ApprovalStats>('/approvals/stats');
        return response.data;
    },

    async approve(purchaseRequestId: number, notes?: string): Promise<void> {
        await apiClient.post(`/approvals/${purchaseRequestId}/approve`, { notes });
    },

    async reject(purchaseRequestId: number, notes: string): Promise<void> {
        await apiClient.post(`/approvals/${purchaseRequestId}/reject`, { notes });
    },

    async approvePartial(
        purchaseRequestId: number,
        approvedItemIds: number[],
        notes?: string
    ): Promise<void> {
        await apiClient.post(`/approvals/${purchaseRequestId}/approve-partial`, {
            approvedItemIds,
            notes,
        });
    },

    async bulkApprove(purchaseRequestIds: number[]): Promise<void> {
        await apiClient.post('/approvals/bulk-approve', { ids: purchaseRequestIds });
    },

    async bulkReject(purchaseRequestIds: number[], notes: string): Promise<void> {
        await apiClient.post('/approvals/bulk-reject', { ids: purchaseRequestIds, notes });
    },
};
