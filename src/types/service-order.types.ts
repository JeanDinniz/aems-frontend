export type ServiceOrderStatus =
    | 'waiting'      // Aguardando
    | 'doing'        // Fazendo
    | 'inspection'   // Inspeção
    | 'ready'        // Pronto
    | 'delivered';   // Entregue

export type Department = 'film' | 'vn' | 'vu' | 'bodywork' | 'workshop';

export type SemaphoreColor = 'white' | 'yellow' | 'orange' | 'red';

export interface QualityChecklistItem {
    label: string;
    checked: boolean;
}

export interface QualityChecklist {
    items: QualityChecklistItem[];
    all_passed: boolean;
    approved_at?: string;
    approved_by?: number;
    rejection_notes?: string;
}

export interface ServiceOrder {
    id: number;
    order_number: string;

    // Cliente e Veículo
    client_name?: string;
    client_phone?: string;
    vehicle_model?: string;
    vehicle_color?: string;
    plate: string;

    // Departamento e Serviço
    department: Department;
    service_type: string;        // Mantendo compatibilidade se necessário, ou usar service_description
    service_description?: string;  // Descrição livre do serviço (LEGACY - use items)
    items?: Array<{ service_id: number; quantity: number; notes?: string }>;
    film_type?: string;          // Opcional agora, específico de film?

    // Workflow
    status: ServiceOrderStatus;
    entry_time: string;           // Hora de entrada (para semáforo)
    started_at: string | null;    // Quando começou (doing)
    completed_at: string | null;  // Quando finalizou
    delivered_at: string | null;  // Quando foi entregue

    // Equipe
    technician_id: number | null;
    technician_name: string | null;
    consultant_id: number | null;
    consultant_name: string | null;
    workers?: Array<{ id: number; name: string; isPrimary: boolean }>;

    // Documentação
    photos: string[];              // URLs das fotos
    damage_map: string | null;     // Mapa de avarias
    invoice_number: string | null; // Número da NF

    // Localização
    location_id: number;
    location_name: string;
    dealership_id: number;
    dealership_name: string;
    destination_store_id?: number; // For warehouse: the store where the service is billed
    destination_store_name?: string;

    // Valores
    total_value: number;
    notes: string | null;

    // Semáforo
    semaphore_color: SemaphoreColor;
    elapsed_minutes: number;

    // Quality
    quality_checklist?: QualityChecklist;
    quality_approved_by?: number;
    quality_approved_at?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface CreateServiceOrderData {
    plate: string;
    vehicle_plate?: string;
    vehicle_model?: string;
    vehicle_color?: string;
    department: Department;
    items: Array<{ service_id: number; quantity: number; notes?: string }>;
    location_id: number;
    dealership_id?: number;
    consultant_id?: number;
    workers?: Array<{ user_id: number }>;
    notes?: string;
    photos?: string[];
    damage_map?: string;
    invoice_number?: string;
    // Campos de venda direta
    client_name?: string;
    client_phone?: string;
    total_value?: number;
    // Campo de galpão
    destination_store_id?: number;
}

export interface UpdateServiceOrderData {
    status?: ServiceOrderStatus;
    technician_id?: number;
    notes?: string;
    worker_ids?: number[];
    primary_worker_id?: number;
    quality_checklist?: QualityChecklist;
    invoice_number?: string;
    // Add other updateable fields as necessary
}

export interface ServiceOrderFilters {
    status?: ServiceOrderStatus | 'all' | string;
    location_id?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
}
