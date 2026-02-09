import { useState } from 'react';
import { useWorkerRanking } from '@/hooks/useWorkerRanking';
import { useStoreStore } from '@/stores/store.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkerRankingTable } from '@/components/reports/WorkerRankingTable';
import { ExportButton } from '@/components/reports/ExportButton';
import { Loader2 } from 'lucide-react';
import { ReportType } from '@/types/reports.types';

export default function WorkerRankingPage() {
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
        limit: 50
    };

    const { data: ranking, isLoading, error } = useWorkerRanking(filters);

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-red-500 mb-4">Erro ao carregar ranking</p>
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
                    <h1 className="text-3xl font-bold">Ranking de Performance</h1>
                    <p className="text-gray-600">Desempenho dos trabalhadores por score</p>
                </div>
                <ExportButton
                    reportType={ReportType.PERFORMANCE_RANKING}
                    filters={filters}
                    disabled={!ranking}
                />
            </div>

            {/* Filtros */}
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

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <p className="text-sm text-blue-900">
                        <strong>Score de Performance:</strong> Calculado com base em 40% Quantidade de O.S.,
                        30% Qualidade Média e 30% Eficiência (tempo de conclusão).
                    </p>
                </CardContent>
            </Card>

            {/* Loading */}
            {isLoading && (
                <div
                    className="flex items-center justify-center h-64"
                    role="status"
                    aria-live="polite"
                >
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="sr-only">Carregando ranking...</span>
                </div>
            )}

            {/* Tabela de Ranking */}
            {ranking && <WorkerRankingTable entries={ranking.entries} />}
        </div>
    );
}
