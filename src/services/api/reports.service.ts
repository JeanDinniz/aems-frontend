import { apiClient } from './client';
import type {
    DashboardData,
    DashboardFilters,
    RankingData,
    RankingFilters,
    MultiStoreData,
    QualityAudit,
    QualityAuditSummary,
    CreateQualityAuditDTO,
    MonthlyGoal,
    MonthlyGoalWithProgress,
    CreateMonthlyGoalDTO,
    ExportRequest
} from '@/types/reports.types';

export const reportsService = {
    /**
     * Dashboard Executivo
     */
    async getDashboard(filters: DashboardFilters): Promise<DashboardData> {
        const { data } = await apiClient.get('/reports/dashboard', {
            params: {
                start_date: filters.start_date,
                end_date: filters.end_date,
                store_ids: filters.store_ids,
                department: filters.department
            }
        });
        return data;
    },

    /**
     * Ranking de Trabalhadores
     */
    async getWorkerRanking(filters: RankingFilters): Promise<RankingData> {
        const { data } = await apiClient.get('/reports/ranking/workers', {
            params: {
                start_date: filters.start_date,
                end_date: filters.end_date,
                store_ids: filters.store_ids,
                department: filters.department,
                limit: filters.limit || 20
            }
        });
        return data;
    },

    /**
     * BI Multi-Loja (Owner only)
     */
    async getMultiStoreComparison(filters: DashboardFilters): Promise<MultiStoreData> {
        const { data } = await apiClient.get('/reports/multi-store', {
            params: {
                start_date: filters.start_date,
                end_date: filters.end_date,
                store_ids: filters.store_ids
            }
        });
        return data;
    },

    /**
     * Auditorias de Qualidade
     */
    async listQualityAudits(params?: {
        store_id?: number;
        start_date?: string;
        end_date?: string;
        skip?: number;
        limit?: number;
    }): Promise<{ audits: QualityAudit[]; total: number }> {
        const { data } = await apiClient.get('/reports/quality-audits', { params });
        return data;
    },

    async getQualityAudit(id: number): Promise<QualityAudit> {
        const { data } = await apiClient.get(`/reports/quality-audits/${id}`);
        return data;
    },

    async createQualityAudit(payload: CreateQualityAuditDTO): Promise<QualityAudit> {
        const { data } = await apiClient.post('/reports/quality-audits', payload);
        return data;
    },

    async getQualityAuditSummary(params: {
        start_date: string;
        end_date: string;
        store_ids?: number[];
    }): Promise<QualityAuditSummary> {
        const { data } = await apiClient.get('/reports/quality-audits/summary', { params });
        return data;
    },

    /**
     * Metas Mensais
     */
    async listMonthlyGoals(params?: {
        store_id?: number;
        year_month?: string;
        skip?: number;
        limit?: number;
    }): Promise<{ goals: MonthlyGoal[]; total: number }> {
        const { data } = await apiClient.get('/reports/goals', { params });
        return data;
    },

    async getMonthlyGoal(id: number): Promise<MonthlyGoal> {
        const { data } = await apiClient.get(`/reports/goals/${id}`);
        return data;
    },

    async createMonthlyGoal(payload: CreateMonthlyGoalDTO): Promise<MonthlyGoal> {
        const { data } = await apiClient.post('/reports/goals', payload);
        return data;
    },

    async getGoalsWithProgress(params: {
        year_month: string;
        store_ids?: number[];
    }): Promise<MonthlyGoalWithProgress[]> {
        const { data } = await apiClient.get('/reports/goals/with-progress', { params });
        return data;
    },

    /**
     * Exportação de Relatórios
     */
    async exportReport(payload: ExportRequest): Promise<Blob> {
        const { data } = await apiClient.post('/reports/export', payload, {
            responseType: 'blob'
        });
        return data;
    }
};
