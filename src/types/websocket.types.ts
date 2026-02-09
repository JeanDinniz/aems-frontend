export type WebSocketEventType =
    | 'service_order_created'
    | 'service_order_updated'
    | 'service_order_status_changed'
    | 'semaphore_updated'
    | 'purchase_request_created'
    | 'purchase_request_approved'
    | 'purchase_request_rejected'
    | 'inventory_alert'
    | 'bobbin_critical';

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

export interface PurchaseRequestEvent {
    id: number;
    request_number: string;
    status: string;
    requester_name: string;
    total_estimated: number;
}

export interface InventoryEvent {
    id: number;
    smart_id: string;
    current_metragem: number;
    percentage: number;
    alert_level: 'low' | 'critical';
}

export interface WebSocketConnection {
    connected: boolean;
    reconnecting: boolean;
    lastConnected: Date | null;
    retryCount: number;
}
