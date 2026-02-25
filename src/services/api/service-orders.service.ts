import apiClient from './client';
import type { ServiceOrder, CreateServiceOrderData, ServiceOrderFilters, QualityChecklist, ServiceOrderStatus } from '@/types/service-order.types';
import type { ServiceOrderCard } from '@/types/day-panel.types';

// ─── Status mapping ──────────────────────────────────────────────────────────
// Backend: 'waiting' | 'in_progress' | 'quality_check' | 'completed' | 'delivered'
// Frontend: 'waiting' | 'doing'       | 'inspection'    | 'ready'     | 'delivered'

const STATUS_B2F: Record<string, ServiceOrderStatus> = {
    in_progress: 'doing',
    quality_check: 'inspection',
    completed: 'ready',
};

const STATUS_F2B: Record<string, string> = {
    doing: 'in_progress',
    inspection: 'quality_check',
    ready: 'completed',
};

function toFrontendStatus(s: string): ServiceOrderStatus {
    return (STATUS_B2F[s] ?? s) as ServiceOrderStatus;
}

function toBackendStatus(s: string): string {
    return STATUS_F2B[s] ?? s;
}

// ─── JSON field parser ────────────────────────────────────────────────────────
function parseJson<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined) return fallback;
    if (typeof value !== 'string') return value as unknown as T;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

// ─── Backend → Frontend mapper ────────────────────────────────────────────────
function mapServiceOrder(raw: any): ServiceOrder {
    const photos = parseJson<string[]>(raw.photos, []);
    const qualityChecklist = raw.quality_checklist
        ? parseJson<QualityChecklist>(raw.quality_checklist, undefined as any)
        : undefined;

    const workers = (raw.workers || []).map((w: any, idx: number) => ({
        id: w.id,
        name: w.employee_name || `Funcionário ${w.employee_id}`,
        isPrimary: idx === 0,
    }));

    return {
        ...raw,
        order_number: raw.order_number || `#${raw.id}`,
        status: toFrontendStatus(raw.status),
        // field name mapping
        plate: raw.vehicle_plate || raw.plate || '',
        location_id: raw.store_id ?? raw.location_id ?? 0,
        location_name: raw.location_name || raw.store_name || '',
        started_at: raw.start_time ?? raw.started_at ?? null,
        completed_at: raw.completion_time ?? raw.completed_at ?? null,
        delivered_at: raw.delivery_time ?? raw.delivered_at ?? null,
        // parsed JSON fields
        photos,
        quality_checklist: qualityChecklist,
        workers,
        // technician = primary worker (first in list)
        technician_id: raw.workers?.[0]?.employee_id ?? null,
        technician_name: raw.workers?.[0]?.employee_name ?? null,
        semaphore_color: raw.semaphore_color || 'white',
        elapsed_minutes: raw.elapsed_minutes || 0,
        service_type: raw.department || '',
        total_value: raw.total_value ?? 0,
        dealership_name: raw.dealership_name || '',
        destination_store_name: raw.destination_store_name || null,
    };
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const serviceOrdersService = {
    getDayPanel: async (storeId?: number, date?: string): Promise<ServiceOrderCard[]> => {
        const { data } = await apiClient.get('/service-orders/day-panel', {
            params: { store_id: storeId, date },
        });
        // Backend returns DayPanelResponse: { store_id, store_name, items, summary }
        const items: any[] = data.items ?? [];

        // Map backend status → day-panel frontend status
        const dayPanelStatusMap: Record<string, ServiceOrderCard['status']> = {
            waiting:      'waiting',
            in_progress:  'in_progress',
            quality_check:'inspection',
            completed:    'ready',
            delivered:    'delivered',
        };

        return items.map((item: any): ServiceOrderCard => ({
            id: item.id,
            orderNumber: item.order_number || `#${item.id}`,
            plate: item.vehicle_plate || '',
            model: [item.vehicle_brand, item.vehicle_model].filter(Boolean).join(' ') || '',
            color: item.vehicle_color ?? undefined,
            status: dayPanelStatusMap[item.status] ?? (item.status as ServiceOrderCard['status']),
            department: (item.department as ServiceOrderCard['department']),
            semaphoreColor: (item.semaphore_color as ServiceOrderCard['semaphoreColor']) || 'white',
            elapsedMinutes: item.elapsed_minutes ?? 0,
            entryTime: item.entry_time || item.created_at,
            estimatedTime: undefined,
            services: (item.services ?? []).map((s: any) => ({ id: s.id, name: s.name || s.service_name || '' })),
            consultantName: item.consultant_name ?? undefined,
            dealershipName: item.dealership_name || '',
            assignedWorkers: (item.workers ?? []).map((w: any) => ({ id: w.id ?? w.employee_id, name: w.employee_name || w.name || '' })),
            storeId: item.store_id ?? data.store_id,
            storeName: item.store_name ?? data.store_name ?? '',
        }));
    },

    getAll: async (filters?: ServiceOrderFilters, skip = 0, limit = 20) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', toBackendStatus(filters.status));
        if (filters?.location_id) params.append('store_id', filters.location_id.toString());
        if (filters?.start_date) params.append('date_from', filters.start_date);
        if (filters?.end_date) params.append('date_to', filters.end_date);
        if (filters?.search) params.append('plate', filters.search);
        params.append('page', (Math.floor(skip / limit) + 1).toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get<{ items: any[]; pagination: { total: number } }>(
            `/service-orders?${params.toString()}`
        );
        const raw = response.data;
        return {
            items: (raw.items || []).map(mapServiceOrder),
            total: raw.pagination?.total ?? 0,
        };
    },

    getById: async (id: number): Promise<ServiceOrder> => {
        const response = await apiClient.get<any>(`/service-orders/${id}`);
        return mapServiceOrder(response.data);
    },

    create: async (data: CreateServiceOrderData) => {
        const response = await apiClient.post<any>('/service-orders', data);
        return mapServiceOrder(response.data);
    },

    update: async (id: number, data: Partial<CreateServiceOrderData>) => {
        const response = await apiClient.patch<any>(`/service-orders/${id}`, data);
        return mapServiceOrder(response.data);
    },

    updateStatus: async (id: number, status: string, extras?: any) => {
        const backendStatus = toBackendStatus(status);
        const response = await apiClient.patch<any>(
            `/service-orders/${id}/status`,
            { new_status: backendStatus, ...extras }
        );
        return mapServiceOrder(response.data);
    },

    cancel: async (id: number, reason?: string): Promise<ServiceOrder> => {
        const params = reason ? { reason } : undefined;
        const response = await apiClient.delete<any>(`/service-orders/${id}`, { params });
        return mapServiceOrder(response.data);
    },

    delete: async (id: number) => {
        await apiClient.delete(`/service-orders/${id}`);
    }
};
