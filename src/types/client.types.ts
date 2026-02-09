export interface Client {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    document: string | null;  // CPF ou CNPJ
    address: string | null;
    city: string | null;
    state: string | null;
    zipcode: string | null;
    notes: string | null;

    // Estatísticas
    total_services: number;
    total_spent: number;
    last_service_date: string | null;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface Vehicle {
    id: number;
    client_id: number;
    plate: string;
    brand: string;
    model: string;
    year: number | null;
    color: string | null;
    created_at: string;
}

export interface CreateClientData {
    name: string;
    email?: string;
    phone: string;
    document?: string;
    address?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    notes?: string;
}

export interface CreateVehicleData {
    client_id: number;
    plate: string;
    brand: string;
    model: string;
    year?: number;
    color?: string;
}

export interface ClientFilters {
    search?: string;  // Nome, telefone, placa
    city?: string;
    has_vehicles?: boolean;
}

export interface ClientStats {
    total_revenue: number;
    services_by_department: Array<{
        department: string;
        count: number;
        revenue: number;
    }>;
    monthly_spending: Array<{
        month: string;
        amount: number;
    }>;
    favorite_services: Array<{
        service: string;
        count: number;
    }>;
}
