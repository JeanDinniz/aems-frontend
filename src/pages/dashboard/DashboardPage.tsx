import { useState } from 'react';
import { Download, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/features/dashboard/KPICard';
import { RevenueChart } from '@/components/features/dashboard/RevenueChart';
import { DepartmentPieChart } from '@/components/features/dashboard/DepartmentPieChart';
import { PerformanceBarChart } from '@/components/features/dashboard/PerformanceBarChart';
import { TopInstallersCard } from '@/components/features/dashboard/TopInstallersCard';
import { TopServicesCard } from '@/components/features/dashboard/TopServicesCard';
import { AlertsCard } from '@/components/features/dashboard/AlertsCard';
import { DashboardFilters } from '@/components/features/dashboard/DashboardFilters';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuthStore } from '@/stores/auth.store';
import { reportsService } from '@/services/api/reports.service';
import { toast } from '@/hooks/use-toast';
import type { DashboardFilters as Filters } from '@/types/dashboard.types';

function DashboardSkeleton() {
    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [filters, setFilters] = useState<Filters>({ period: 'today' });
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading, refetch, isRefetching } = useDashboardData(filters);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await reportsService.exportReport({
                type: 'dashboard',
                format: 'excel',
                filters: {
                    start_date: filters.start_date,
                    end_date: filters.end_date,
                    store_ids: filters.store_ids,
                    department: filters.department,
                },
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: 'Relatório exportado', description: 'O arquivo foi baixado com sucesso.' });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erro ao exportar',
                description: 'Não foi possível gerar o relatório. Tente novamente.',
            });
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) return <DashboardSkeleton />;

    const safeData = data || {
        kpis: {
            totalOrdersToday: 0,
            completedOrdersToday: 0,
            inProgressOrdersToday: 0,
            delayedOrders: 0,
            revenueThisMonth: 0,
            revenueLastMonth: 0,
            revenueGrowth: 0,
            averageCompletionTime: 0,
            productivity: 0,
            nps: 0
        },
        revenueData: [],
        departmentData: [],
        storePerformance: [],
        topInstallers: [],
        topServices: [],
        alerts: []
    };

    const hasAlerts = safeData.alerts.length > 0;

    return (
        <div className="space-y-6 page-enter">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-5 w-5 text-aems-primary-500" />
                        <h1 className="text-2xl font-bold text-aems-neutral-700">Dashboard</h1>
                    </div>
                    <p className="text-sm text-aems-neutral-400">
                        Visão geral da operação •{' '}
                        <span className="font-medium text-aems-neutral-500">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="gap-2 border-aems-neutral-200 text-aems-neutral-600 hover:text-aems-neutral-800 hover:border-aems-neutral-300"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="gap-2 border-aems-primary-400/50 text-aems-primary-600 hover:bg-aems-primary-400/10 hover:border-aems-primary-400"
                    >
                        {isExporting
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <Download className="h-4 w-4" />
                        }
                        {isExporting ? 'Exportando...' : 'Exportar'}
                    </Button>
                </div>
            </div>

            {/* ── Filtros ── */}
            <DashboardFilters filters={filters} onFiltersChange={setFilters} />

            {/* ── Alertas prioritários ── */}
            {hasAlerts && (
                <div className="relative">
                    <div className="absolute -left-1 top-0 bottom-0 w-1 rounded-full bg-aems-error" />
                    <AlertsCard alerts={safeData.alerts} />
                </div>
            )}

            {/* ── KPIs Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <KPICard
                    title="O.S. Hoje"
                    value={safeData.kpis.totalOrdersToday}
                    subtitle={`${safeData.kpis.completedOrdersToday} concluídas`}
                    trend={safeData.kpis.totalOrdersToday > 0
                        ? (safeData.kpis.completedOrdersToday / safeData.kpis.totalOrdersToday) * 100
                        : 0}
                    icon="car"
                />
                <KPICard
                    title="Faturamento Mês"
                    value={safeData.kpis.revenueThisMonth}
                    format="currency"
                    subtitle={`${safeData.kpis.revenueGrowth > 0 ? '+' : ''}${safeData.kpis.revenueGrowth.toFixed(1)}% vs mês anterior`}
                    trend={safeData.kpis.revenueGrowth}
                    icon="dollar"
                />
                <KPICard
                    title="Produtividade"
                    value={safeData.kpis.productivity}
                    format="percent"
                    subtitle={`Tempo médio: ${safeData.kpis.averageCompletionTime}min`}
                    trend={safeData.kpis.productivity}
                    icon="zap"
                />
                <KPICard
                    title="NPS"
                    value={safeData.kpis.nps}
                    subtitle="Net Promoter Score"
                    trend={safeData.kpis.nps}
                    icon="heart"
                />
            </div>

            {/* ── Alerta de O.S. atrasadas inline (se não há alertsCard) ── */}
            {!hasAlerts && safeData.kpis.delayedOrders > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-aems-warning-light border border-aems-warning/30 rounded-xl text-sm">
                    <AlertCircle className="h-4 w-4 text-aems-warning flex-shrink-0" />
                    <span className="text-aems-neutral-700">
                        <strong className="text-aems-warning">{safeData.kpis.delayedOrders} ordens</strong> estão atrasadas e precisam de atenção.
                    </span>
                    <Button variant="link" size="sm" className="ml-auto h-auto p-0 text-aems-warning font-medium hover:text-aems-warning/80">
                        Ver painel →
                    </Button>
                </div>
            )}

            {/* ── Gráficos ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={safeData.revenueData} />
                <DepartmentPieChart data={safeData.departmentData} />
            </div>

            {/* ── Performance por Loja ── */}
            {user?.role !== 'operator' && (
                <PerformanceBarChart data={safeData.storePerformance} />
            )}

            {/* ── Rankings ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopInstallersCard installers={safeData.topInstallers} />
                <TopServicesCard services={safeData.topServices} />
            </div>
        </div>
    );
}
