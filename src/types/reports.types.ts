/**
 * Tipos e interfaces para o módulo de Reports/BI
 */

// ===== ENUMS =====

export enum ReportType {
    EXECUTIVE_DASHBOARD = 'executive_dashboard',
    PERFORMANCE_RANKING = 'performance_ranking',
    MULTI_STORE_BI = 'multi_store_bi',
    QUALITY_AUDIT = 'quality_audit'
}

export enum ExportFormat {
    PDF = 'pdf',
    EXCEL = 'excel',
    CSV = 'csv'
}

export enum GoalType {
    REVENUE = 'revenue',           // Faturamento
    OS_COUNT = 'os_count',         // Quantidade de O.S.
    QUALITY_SCORE = 'quality_score' // Score de qualidade
}

export enum AuditStatus {
    PENDING = 'pending',     // Pendente
    COMPLETED = 'completed', // Completa
    FAILED = 'failed'        // Falhou
}

export enum ServiceDepartment {
    FILM = 'film',             // Película
    BODYWORK = 'bodywork',     // Funilaria
    AESTHETICS = 'aesthetics'  // Estética
}

// ===== LABELS TRADUZIDOS =====

export const GoalTypeLabels: Record<GoalType, string> = {
    [GoalType.REVENUE]: 'Faturamento',
    [GoalType.OS_COUNT]: 'Quantidade de O.S.',
    [GoalType.QUALITY_SCORE]: 'Score de Qualidade'
};

export const AuditStatusLabels: Record<AuditStatus, string> = {
    [AuditStatus.PENDING]: 'Pendente',
    [AuditStatus.COMPLETED]: 'Completa',
    [AuditStatus.FAILED]: 'Falhou'
};

export const ServiceDepartmentLabels: Record<ServiceDepartment, string> = {
    [ServiceDepartment.FILM]: 'Película',
    [ServiceDepartment.BODYWORK]: 'Funilaria',
    [ServiceDepartment.AESTHETICS]: 'Estética'
};

// ===== DASHBOARD =====

export interface RevenueMetrics {
    total_revenue: number;
    revenue_by_department: Record<string, number>;
    revenue_by_store: Record<string, number>;
    comparison_previous_period?: number; // Percentual
}

export interface OSMetrics {
    total_os: number;
    os_by_status: Record<string, number>;
    os_by_department: Record<string, number>;
    avg_completion_time_minutes?: number;
    os_delivered_on_time_pct?: number; // Percentual
}

export interface SemaphoreDistribution {
    white: number;
    yellow: number;
    orange: number;
    red: number;
}

export interface GoalProgress {
    goal_id: number;
    goal_type: GoalType;
    target_value: number;
    current_value: number;
    progress_pct: number; // Percentual
    remaining: number;
}

export interface DashboardData {
    revenue_metrics: RevenueMetrics;
    os_metrics: OSMetrics;
    semaphore_distribution: SemaphoreDistribution;
    goal_progress: GoalProgress[];
    avg_quality_score?: number;
}

// ===== RANKING =====

export interface WorkerRankingEntry {
    user_id: number;
    user_name: string;
    store_id: number;
    store_name: string;
    total_os: number;
    avg_quality_score: number;
    avg_completion_time_minutes: number;
    total_score: number; // Score calculado (0.4×Qtd + 0.3×Qualidade + 0.3×Eficiência)
    rank: number;
}

export interface RankingData {
    period_start: string; // ISO 8601
    period_end: string;   // ISO 8601
    entries: WorkerRankingEntry[];
}

// ===== MULTI-STORE BI =====

export interface StoreComparison {
    store_id: number;
    store_name: string;
    total_os: number;
    total_revenue: number;
    avg_completion_time_minutes: number;
    avg_quality_score: number;
    semaphore_distribution: SemaphoreDistribution;
}

export interface MultiStoreData {
    period_start: string; // ISO 8601
    period_end: string;   // ISO 8601
    stores: StoreComparison[];
}

// ===== QUALITY AUDIT =====

export interface QualityChecklist {
    cleanliness: number;      // 0-10
    organization: number;     // 0-10
    equipment_condition: number; // 0-10
    safety_compliance: number;   // 0-10
    customer_service: number;    // 0-10
}

export interface QualityAudit {
    id: number;
    store_id: number;
    audit_date: string; // ISO 8601
    auditor_id: number;
    auditor_name?: string;
    checklist: QualityChecklist;
    overall_score: number; // 0-100 (calculado automaticamente)
    observations?: string;
    photos?: string[]; // URLs
    status: AuditStatus;
    created_at: string; // ISO 8601
    updated_at: string; // ISO 8601
}

export interface QualityAuditSummary {
    total_audits: number;
    avg_score: number;
    score_trend: number; // Variação percentual
    by_store: Array<{
        store_id: number;
        store_name: string;
        audit_count: number;
        avg_score: number;
    }>;
    by_category: Record<keyof QualityChecklist, number>;
}

// ===== MONTHLY GOALS =====

export interface MonthlyGoal {
    id: number;
    store_id: number;
    year_month: string; // "YYYY-MM"
    goal_type: GoalType;
    target_value: number;
    created_by_id: number;
    created_at: string; // ISO 8601
    updated_at: string; // ISO 8601
}

export interface MonthlyGoalWithProgress extends MonthlyGoal {
    current_value: number;
    progress_pct: number;
    remaining: number;
}

// ===== EXPORT =====

export interface ExportRequest {
    report_type: ReportType;
    export_format: ExportFormat;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    store_ids?: number[];
    department?: ServiceDepartment;
}

// ===== DTOs =====

export interface DashboardFilters {
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    store_ids?: number[];
    department?: ServiceDepartment;
}

export interface RankingFilters {
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    store_ids?: number[];
    department?: ServiceDepartment;
    limit?: number;
}

export interface CreateQualityAuditDTO {
    store_id: number;
    audit_date: string; // YYYY-MM-DD
    checklist: QualityChecklist;
    observations?: string;
    photos?: string[];
}

export interface CreateMonthlyGoalDTO {
    store_id: number;
    year_month: string; // "YYYY-MM"
    goal_type: GoalType;
    target_value: number;
}
