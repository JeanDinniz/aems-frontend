export type SemaphoreColor = 'white' | 'yellow' | 'orange' | 'red';
export type ServiceOrderStatus = 'waiting' | 'in_progress' | 'inspection' | 'ready' | 'delivered';
export type Department = 'film' | 'esthetics' | 'bodywork';

export interface ServiceOrderCard {
    id: number;
    orderNumber: string;         // "OS-001"
    plate: string;                // "ABC1D23"
    model: string;                // "Honda Civic"
    color?: string;               // "Prata"
    status: ServiceOrderStatus;
    department: Department;
    semaphoreColor: SemaphoreColor;
    entryTime: string;            // ISO string
    estimatedTime?: number;       // minutos
    services: Array<{
        id: number;
        name: string;
    }>;
    consultantName?: string;
    dealershipName: string;
    assignedWorkers?: Array<{
        id: number;
        name: string;
    }>;
    storeId: number;
    storeName: string;
}
