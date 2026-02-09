import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useStoreStore } from '@/stores/store.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MetricCard } from '@/components/reports/MetricCard';
import { GoalProgressCard } from '@/components/reports/GoalProgressCard';
import { SemaphoreChart } from '@/components/reports/SemaphoreChart';
import { RevenueByDepartmentChart } from '@/components/reports/RevenueByDepartmentChart';
import { QualityScoreGauge } from '@/components/reports/QualityScoreGauge';
import { ExportButton } from '@/components/reports/ExportButton';
import { DollarSign, ClipboardList, TrendingUp, Loader2 } from 'lucide-react';
import { ReportType } from '@/types/reports.types';

export default function ExecutiveDashboardPage() {
    const { selectedStoreId } = useStoreStore();

    // Default: últimos 30 dias
    const [today] = useState(() => new Date().toISOString().split('T')[0]);
    const [thirtyDaysAgo] = useState(() =>
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );

    const [startDate, setStartDate] = useState(thirtyDaysAgo);
    const [endDate, setEndDate] = useState(today);

    const filters = {
        start_date: startDate,
        end_date: endDate,
        store_ids: selectedStoreId ? [selectedStoreId] : undefined,
    };

    const { data: dashboard, isLoading, error } = useDashboard(filters);

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-red-500 mb-4">Erro ao carregar dashboard</p>
                    <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
                    <p className="text-gray-600">Visão geral de métricas e performance</p>
                </div>
                <ExportButton
                    reportType={ReportType.EXECUTIVE_DASHBOARD}
                    filters={filters}
                    disabled={!dashboard}
                />
            </div>

            {/* Filtros de Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Período</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Data Inicial</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Data Final</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                <div
                    className="flex items-center justify-center h-64"
                    role="status"
                    aria-live="polite"
                >
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="sr-only">Carregando dashboard...</span>
                </div>
            )}

            {dashboard && (
                <>
                    {/* Métricas Principais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard
                            title="Faturamento Total"
                            value={new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(dashboard.revenue_metrics.total_revenue)}
                            icon={DollarSign}
                            trend={
                                dashboard.revenue_metrics.comparison_previous_period
                                    ? {
                                        value: dashboard.revenue_metrics.comparison_previous_period,
                                        isPositive: dashboard.revenue_metrics.comparison_previous_period > 0
                                    }
                                    : undefined
                            }
                        />
                        <MetricCard
                            title="Total de O.S."
                            value={dashboard.os_metrics.total_os}
                            icon={ClipboardList}
                            description={`${dashboard.os_metrics.os_delivered_on_time_pct?.toFixed(0) || 0}% no prazo`}
                        />
                        <MetricCard
                            title="Tempo Médio"
                            value={
                                dashboard.os_metrics.avg_completion_time_minutes
                                    ? `${Math.round(dashboard.os_metrics.avg_completion_time_minutes)} min`
                                    : 'N/A'
                            }
                            icon={TrendingUp}
                            description="Tempo de conclusão"
                        />
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RevenueByDepartmentChart data={dashboard.revenue_metrics.revenue_by_department} />
                        <SemaphoreChart data={dashboard.semaphore_distribution} />
                    </div>

                    {/* Qualidade e Metas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Score de Qualidade */}
                        {dashboard.avg_quality_score !== undefined && (
                            <QualityScoreGauge score={dashboard.avg_quality_score} />
                        )}

                        {/* Metas */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-semibold">Progresso de Metas</h2>
                            {!dashboard.goal_progress || dashboard.goal_progress.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-gray-500">
                                        Nenhuma meta definida para este período
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dashboard.goal_progress.map((goal) => (
                                        <GoalProgressCard
                                            key={goal.goal_id}
                                            goalType={goal.goal_type}
                                            targetValue={goal.target_value}
                                            currentValue={goal.current_value}
                                            progressPct={goal.progress_pct}
                                            remaining={goal.remaining}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
