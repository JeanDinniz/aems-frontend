/**
 * Tipos e interfaces para o módulo de Ocorrências de RH
 */

// ===== ENUMS =====

export enum OccurrenceType {
    ABSENCE = 'absence',           // Falta
    LATE_ARRIVAL = 'late_arrival', // Atraso
    WARNING = 'warning',           // Advertência
    SUSPENSION = 'suspension',     // Suspensão
    OTHER = 'other'                // Outro
}

export enum OccurrenceSeverity {
    LOW = 'low',           // Baixa
    MEDIUM = 'medium',     // Média
    HIGH = 'high',         // Alta
    CRITICAL = 'critical'  // Crítica
}

// ===== LABELS TRADUZIDOS =====

export const OccurrenceTypeLabels: Record<OccurrenceType, string> = {
    [OccurrenceType.ABSENCE]: 'Falta',
    [OccurrenceType.LATE_ARRIVAL]: 'Atraso',
    [OccurrenceType.WARNING]: 'Advertência',
    [OccurrenceType.SUSPENSION]: 'Suspensão',
    [OccurrenceType.OTHER]: 'Outro'
};

export const OccurrenceSeverityLabels: Record<OccurrenceSeverity, string> = {
    [OccurrenceSeverity.LOW]: 'Baixa',
    [OccurrenceSeverity.MEDIUM]: 'Média',
    [OccurrenceSeverity.HIGH]: 'Alta',
    [OccurrenceSeverity.CRITICAL]: 'Crítica'
};

// ===== INTERFACES =====

export interface Occurrence {
    id: number;
    store_id: number;
    employee_id: number;

    // Tipo e severidade
    occurrence_type: OccurrenceType;
    severity: OccurrenceSeverity;

    // Datas
    occurrence_date: string;  // ISO 8601
    reported_at: string;      // ISO 8601

    // Descrição
    description: string;
    notes?: string;

    // Relacionamentos (IDs)
    reported_by_id: number;

    // Reconhecimento
    acknowledged: boolean;
    acknowledged_at?: string;  // ISO 8601
    acknowledged_by_id?: number;

    // Anexos
    attachments?: OccurrenceAttachment[];

    // Auditoria
    created_at: string;  // ISO 8601
    updated_at: string;  // ISO 8601
}

export interface OccurrenceAttachment {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;  // bytes
    uploaded_at: string;
}

// ===== FILTROS =====

export interface OccurrenceFilters {
    store_id?: number;
    employee_id?: number;
    occurrence_type?: OccurrenceType;
    severity?: OccurrenceSeverity;
    acknowledged?: boolean;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}

// ===== DTOs (Data Transfer Objects) =====

export interface CreateOccurrenceDTO {
    store_id: number;
    employee_id: number;
    occurrence_type: OccurrenceType;
    severity: OccurrenceSeverity;
    occurrence_date: string;  // ISO 8601
    description: string;
    notes?: string;
    attachments?: Record<string, any>;
}

export interface UpdateOccurrenceDTO {
    occurrence_type?: OccurrenceType;
    severity?: OccurrenceSeverity;
    occurrence_date?: string;  // ISO 8601
    description?: string;
    notes?: string;
    attachments?: Record<string, any>;
}

export interface AcknowledgeOccurrenceDTO {
    notes?: string;
}

// ===== RESPONSE TYPES =====

export interface OccurrenceListResponse {
    occurrences: Occurrence[];
    total: number;
    skip: number;
    limit: number;
}

export interface OccurrenceStats {
    total: number;
    by_type: Record<OccurrenceType, number>;
    by_severity: Record<OccurrenceSeverity, number>;
    unacknowledged: number;
    this_month: number;
}
