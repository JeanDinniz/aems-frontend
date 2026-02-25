export type SemaphoreColor = 'white' | 'yellow' | 'orange' | 'red';
export type ServiceOrderStatus = 'waiting' | 'in_progress' | 'inspection' | 'ready' | 'delivered';
export type Department = 'film' | 'ppf' | 'vn' | 'vu' | 'bodywork' | 'workshop';

export interface ServiceOrderCard {
    id: number;
    orderNumber: string;          // "LJ01-2601-001" ou "#42"
    plate: string;                // "ABC1D23"
    model: string;                // "Honda Civic"
    color?: string;               // "Prata"
    status: ServiceOrderStatus;
    department: Department;
    semaphoreColor: SemaphoreColor;
    elapsedMinutes: number;       // Minutos decorridos desde a entrada
    entryTime: string;            // ISO string
    estimatedTime?: number;       // minutos estimados (opcional)
    services: Array<{
        id: number;
        name: string;
    }>;
    consultantName?: string;
    dealershipName?: string;
    assignedWorkers?: Array<{
        id: number;
        name: string;
    }>;
    storeId: number;
    storeName: string;
}
