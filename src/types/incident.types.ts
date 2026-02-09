export interface Incident {
    id: string;
    incident_number: string;        // INC-2025-001
    title: string;
    description: string;
    category: IncidentCategory;
    priority: IncidentPriority;
    status: IncidentStatus;

    // Localização
    store_id: string;
    store_name?: string;
    department?: Department;

    // Relacionamentos
    service_order_id?: string;
    reported_by_user_id: string;
    reported_by_user_name?: string;
    assigned_to_user_id?: string;
    assigned_to_user_name?: string;

    // Datas
    reported_at: string;            // ISO 8601
    resolved_at?: string;
    deadline?: string;

    // Detalhes
    impact_level: ImpactLevel;
    resolution_notes?: string;
    attachments?: IncidentAttachment[];

    // Auditoria
    created_at: string;
    updated_at: string;
}

export enum IncidentCategory {
    EQUIPMENT = 'Equipamento',
    MATERIAL = 'Material/Insumo',
    QUALITY = 'Qualidade do Serviço',
    SAFETY = 'Segurança',
    CUSTOMER = 'Atendimento ao Cliente',
    PROCESS = 'Processo Operacional',
    IT = 'TI/Sistema',
    OTHER = 'Outro'
}

export enum IncidentPriority {
    LOW = 'Baixa',
    MEDIUM = 'Média',
    HIGH = 'Alta',
    URGENT = 'Urgente'
}

export enum IncidentStatus {
    OPEN = 'Aberto',
    IN_PROGRESS = 'Em Andamento',
    WAITING = 'Aguardando',
    RESOLVED = 'Resolvido',
    CLOSED = 'Fechado',
    CANCELLED = 'Cancelado'
}

export enum ImpactLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum Department {
    LAVAGEM = 'Lavagem',
    POLIMENTO = 'Polimento',
    INSULFILM = 'Insulfilm',
    ESTETICA_COMPLETA = 'Estética Completa'
}

export interface IncidentAttachment {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;           // em bytes
    uploaded_by_user_id: string;
    uploaded_by_user_name?: string;
    uploaded_at: string;
}

export interface IncidentUpdate {
    id: string;
    incident_id: string;
    user_id: string;
    user_name?: string;
    update_type: UpdateType;
    content: string;
    old_value?: string;
    new_value?: string;
    attachments?: IncidentAttachment[];
    created_at: string;
}

export enum UpdateType {
    CREATED = 'created',
    COMMENT = 'comment',
    STATUS_CHANGE = 'status_change',
    ASSIGNMENT = 'assignment',
    ATTACHMENT = 'attachment',
    PRIORITY_CHANGE = 'priority_change',
    RESOLVED = 'resolved',
    REOPENED = 'reopened',
    DEADLINE_CHANGE = 'deadline_change',
    CATEGORY_CHANGE = 'category_change'
}

export interface IncidentFilters {
    status?: IncidentStatus | 'all';
    priority?: IncidentPriority | 'all';
    category?: IncidentCategory | 'all';
    store_id?: string | 'all';
    assigned_to?: string | 'all';
    search?: string;
    date_from?: string;
    date_to?: string;
}

export interface IncidentStats {
    total_open: number;
    total_in_progress: number;
    total_resolved_today: number;
    total_overdue: number;
    sla_compliance_rate: number;
    avg_resolution_time_hours: number;
    by_category: Record<IncidentCategory, number>;
    by_priority: Record<IncidentPriority, number>;
    by_store: Array<{ store_id: string; store_name: string; count: number }>;
}

export interface CreateIncidentDTO {
    title: string;
    description: string;
    category: IncidentCategory;
    priority: IncidentPriority;
    store_id: string;
    department?: Department;
    service_order_id?: string;
    impact_level: ImpactLevel;
    deadline?: string;
    assigned_to_user_id?: string;
}

export interface UpdateIncidentDTO {
    title?: string;
    description?: string;
    category?: IncidentCategory;
    priority?: IncidentPriority;
    status?: IncidentStatus;
    impact_level?: ImpactLevel;
    deadline?: string;
    assigned_to_user_id?: string;
    resolution_notes?: string;
}

export interface TimelineItemConfig {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
}

export interface AddCommentDTO {
    incident_id: string;
    content: string;
    attachments?: File[];
}
