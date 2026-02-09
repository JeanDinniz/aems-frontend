import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { DashboardFilters as Filters } from '@/types/dashboard.types';


export default function DashboardPage() {
    const { user } = useAuthStore();
    const [filters, setFilters] = useState<Filters>({ period: 'today' });

    const { data, isLoading, refetch } = useDashboardData(filters);

    const handleExport = async () => {
        // TODO: Exportar relatório
        console.log('Exporting report...');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    // Fallback for null data if error occurs
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-gray-600">
                        Visão geral da operação • {new Date().toLocaleDateString('pt-BR')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <DashboardFilters filters={filters} onFiltersChange={setFilters} />

            {/* Alertas */}
            {safeData.alerts.length > 0 && <AlertsCard alerts={safeData.alerts} />}

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="O.S. Hoje"
                    value={safeData.kpis.totalOrdersToday}
                    subtitle={`${safeData.kpis.completedOrdersToday} concluídas`}
                    trend={safeData.kpis.totalOrdersToday > 0 ? (safeData.kpis.completedOrdersToday / safeData.kpis.totalOrdersToday) * 100 : 0}
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

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={safeData.revenueData} />
                <DepartmentPieChart data={safeData.departmentData} />
            </div>

            {/* Performance por Loja (Owner/Supervisor) */}
            {user?.role !== 'operator' && (
                <PerformanceBarChart data={safeData.storePerformance} />
            )}

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopInstallersCard installers={safeData.topInstallers} />
                <TopServicesCard services={safeData.topServices} />
            </div>
        </div>
    );
}
