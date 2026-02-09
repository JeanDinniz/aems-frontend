import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/api/reports.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExportButton } from '@/components/reports/ExportButton';
import { Loader2 } from 'lucide-react';
import { ReportType } from '@/types/reports.types';

export default function MultiStoreBIPage() {
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
    };

    const { data: multiStore, isLoading, error } = useQuery({
        queryKey: ['multi-store', filters],
        queryFn: () => reportsService.getMultiStoreComparison(filters),
        enabled: !!startDate && !!endDate,
    });

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-red-500 mb-4">Erro ao carregar comparativo</p>
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
                    <h1 className="text-3xl font-bold">BI Multi-Loja</h1>
                    <p className="text-gray-600">Comparativo de performance entre lojas</p>
                </div>
                <ExportButton
                    reportType={ReportType.MULTI_STORE_BI}
                    filters={filters}
                    disabled={!multiStore}
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

            {/* Loading */}
            {isLoading && (
                <div
                    className="flex items-center justify-center h-64"
                    role="status"
                    aria-live="polite"
                >
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="sr-only">Carregando comparativo de lojas...</span>
                </div>
            )}

            {/* Tabela Comparativa */}
            {multiStore && (
                <Card>
                    <CardHeader>
                        <CardTitle>Comparativo de Lojas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loja</TableHead>
                                    <TableHead className="text-right">Total O.S.</TableHead>
                                    <TableHead className="text-right">Faturamento</TableHead>
                                    <TableHead className="text-right">Tempo Médio</TableHead>
                                    <TableHead className="text-right">Score Qualidade</TableHead>
                                    <TableHead className="text-right">🟢 Branco</TableHead>
                                    <TableHead className="text-right"> Amarelo</TableHead>
                                    <TableHead className="text-right"> Laranja</TableHead>
                                    <TableHead className="text-right">🔴 Vermelho</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {multiStore.stores.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                            Sem dados disponíveis
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    multiStore.stores.map((store) => (
                                        <TableRow key={store.store_id}>
                                            <TableCell className="font-medium">{store.store_name}</TableCell>
                                            <TableCell className="text-right">{store.total_os}</TableCell>
                                            <TableCell className="text-right">
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL'
                                                }).format(store.total_revenue)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {Math.round(store.avg_completion_time_minutes)} min
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {store.avg_quality_score.toFixed(1)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {store.semaphore_distribution.white}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {store.semaphore_distribution.yellow}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {store.semaphore_distribution.orange}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {store.semaphore_distribution.red}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
