export type WebSocketEventType =
    | 'service_order_created'
    | 'service_order_updated'
    | 'service_order_status_changed'
    | 'semaphore_updated';

export interface WebSocketEvent<T = any> {
    event: WebSocketEventType;
    data: T;
    timestamp: string;
    store_id?: number;
}

export interface ServiceOrderEvent {
    id: number;
    order_number: string;
    status: string;
    semaphore_color?: string;
    elapsed_minutes?: number;
}

export interface WebSocketConnection {
    connected: boolean;
    reconnecting: boolean;
    lastConnected: Date | null;
    retryCount: number;
}
