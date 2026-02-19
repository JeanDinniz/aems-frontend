export interface Consultant {
    id: number;
    name: string;
    store_id: number;
    store_name?: string;
    dealership_id: number;
    dealership_name?: string;
    phone?: string | null;
    email?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface CreateConsultantPayload {
    name: string;
    store_id: number;
    dealership_id: number;
    phone?: string;
    email?: string;
}

export interface UpdateConsultantPayload {
    name?: string;
    store_id?: number;
    phone?: string;
    email?: string;
    is_active?: boolean;
}

export interface ConsultantFilters {
    store_id?: number;
    dealership_id?: number;
    is_active?: boolean;
    search?: string;
}

export interface ConsultantsListResponse {
    consultants: Consultant[];
    total: number;
    page: number;
    pageSize: number;
}
