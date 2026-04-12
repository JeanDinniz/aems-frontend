export interface Employee {
    id: number;
    name: string;
    store_id: number;
    position?: string | null;
    department?: string | null;
    store_name?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string | null;
}

export interface CreateEmployeePayload {
    name: string;
    store_id: number;
    position?: string;
    department?: string;
}

export interface UpdateEmployeePayload {
    name?: string;
    position?: string | null;
    department?: string | null;
    is_active?: boolean;
}

export interface EmployeeFilters {
    store_id?: number;
    is_active?: boolean;
    search?: string;
    department?: string;
    position?: string;
}

export interface EmployeesListResponse {
    employees: Employee[];
    total: number;
    page: number;
    pageSize: number;
}
