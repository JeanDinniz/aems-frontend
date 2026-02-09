export type FilmBobbinStatus = 'available' | 'in_use' | 'finished';

export interface BobbinAlert {
    id: number;
    smart_id: string;
    film_type: string;
    film_name: string; // derived or same as type
    current_meters: number;
    initial_meters: number;
    percentage_remaining: number;
    alert_level: 'critical' | 'warning' | 'normal';
    store_id: number;
    store_name: string;
}

export interface YieldStats {
    total_yield: number; // percentage
    status: 'normal' | 'below' | 'above';
    min_expected: number;
    max_expected: number;
    target: number;
    period: string; // 'last_30_days', etc.
}

export interface FilmBobbin {
    id: number;
    smart_id: string;
    store_id: number;
    store_name: string;
    film_type: string;
    nominal_metragem: number;    // Metragem original
    current_metragem: number;    // Metragem restante
    supplier: string | null;
    batch_number: string | null;
    purchase_date: string;
    status: FilmBobbinStatus;
    yield_percentage: number | null;
    created_at: string;
    finished_at: string | null;
}

export interface CreateFilmBobbinData {
    film_type: string;
    nominal_metragem: number;
    store_id: number;
    supplier?: string;
    batch_number?: string;
    purchase_date: string;
}

export interface FilmBobbinFilters {
    film_type?: string;
    status?: FilmBobbinStatus;
    store_id?: number;
    search?: string;  // Busca por SMART ID
}

export interface FilmConsumption {
    bobbin_id: number;
    service_order_id: number;
    metragem_used: number;
    notes?: string;
}

// Tipos de película disponíveis
export const FILM_TYPES = {
    FUM35: 'Fumê 35%',
    FUM50: 'Fumê 50%',
    FUM70: 'Fumê 70%',
    CERA: 'Cerâmico',
    NANO: 'Nano Cerâmico',
    SEGUR: 'Segurança',
    ANTIUV: 'Anti UV',
    OTHER: 'Outro'
} as const;

export const SUPPLIERS = [
    '3M',
    'Insulfilm',
    'LLumar',
    'V-Kool',
    'Solar Gard',
    'Outro'
] as const;
