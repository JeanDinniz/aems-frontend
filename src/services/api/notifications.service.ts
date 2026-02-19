import { apiClient } from './client';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    read: boolean;
    created_at: string;
    related_url?: string | null;
}

export interface UnreadCountResponse {
    count: number;
}

export const notificationsService = {
    async list(limit = 20): Promise<Notification[]> {
        const response = await apiClient.get<Notification[]>('/notifications', {
            params: { limit },
        });
        return response.data;
    },

    async getUnreadCount(): Promise<number> {
        const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
        return response.data.count;
    },

    async markAsRead(id: number): Promise<void> {
        await apiClient.patch(`/notifications/${id}/read`);
    },

    async markAllAsRead(): Promise<void> {
        await apiClient.post('/notifications/mark-all-read');
    },
};
