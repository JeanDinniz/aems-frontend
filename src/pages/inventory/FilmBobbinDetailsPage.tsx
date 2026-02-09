import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFilmBobbin } from '@/hooks/useFilmBobbins';
import { filmBobbinsService } from '@/services/api/film-bobbins.service';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Edit, Ruler, Calendar, Truck, Tag, Activity } from 'lucide-react';
import { BobbinStockStatus } from '@/components/features/inventory/BobbinStockStatus';
import { RegisterConsumptionDialog } from '@/components/features/inventory/RegisterConsumptionDialog';
import { FILM_TYPES } from '@/types/inventory.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { YieldAnalysisCard } from '@/components/features/inventory/YieldAnalysisCard';

export default function FilmBobbinDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);

    const { data: bobbin, isLoading } = useFilmBobbin(Number(id));

    // Fetch history
    const { data: history, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['bobbin-history', id],
        queryFn: () => filmBobbinsService.getConsumptionHistory(Number(id)),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <span className="loading loading-spinner loading-lg">Carregando...</span>
            </div>
        );
    }

    if (!bobbin) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Bobina não encontrada</h2>
                <Button onClick={() => navigate('/inventory')} className="mt-4">
                    Voltar para o Inventário
                </Button>
            </div>
        );
    }

    const percentage = (bobbin.current_metragem / bobbin.nominal_metragem) * 100;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight font-mono">
                                {bobbin.smart_id}
                            </h1>
                            <Badge variant="outline">
                                {FILM_TYPES[bobbin.film_type as keyof typeof FILM_TYPES] || bobbin.film_type}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Truck className="h-3 w-3" /> {bobbin.supplier || 'Fornecedor não informado'}
                            <span className="mx-1">•</span>
                            <Calendar className="h-3 w-3" /> {format(new Date(bobbin.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/inventory/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                    {bobbin.status !== 'finished' && (
                        <Button onClick={() => setConsumptionDialogOpen(true)}>
                            <Ruler className="mr-2 h-4 w-4" />
                            Registrar Consumo
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Status Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Status do Estoque</CardTitle>
                        <CardDescription>Metragem disponível e consumo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <BobbinStockStatus
                                nominalMetragem={bobbin.nominal_metragem}
                                currentMetragem={bobbin.current_metragem}
                                status={bobbin.status}
                                showPercentage={false}
                            />
                            <span className="text-2xl font-bold">
                                {percentage.toFixed(0)}% Restante
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Disponível: <strong>{bobbin.current_metragem.toFixed(2)}m</strong></span>
                                <span>Original: <strong>{bobbin.nominal_metragem.toFixed(2)}m</strong></span>
                            </div>
                            <Progress value={percentage} className="h-3" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Tag className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Lote</p>
                                    <p className="font-medium">{bobbin.batch_number || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Activity className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Rendimento</p>
                                    <p className="font-medium">{bobbin.yield_percentage ? `${bobbin.yield_percentage}%` : 'Calculando...'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Lateral */}
                <div className="space-y-6">
                    <YieldAnalysisCard bobbinId={Number(id)} />

                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-muted-foreground">Loja:</span>
                                    <span>{bobbin.store_name || `Loja ${bobbin.store_id}`}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-muted-foreground">Criado em:</span>
                                    <span>{format(new Date(bobbin.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                                </li>
                                {bobbin.finished_at && (
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Finalizado em:</span>
                                        <span>{format(new Date(bobbin.finished_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Histórico */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Consumo</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Ordem de Serviço</TableHead>
                                <TableHead>Metragem Usada</TableHead>
                                <TableHead>Observações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingHistory ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6">Carregando histórico...</TableCell>
                                </TableRow>
                            ) : !history || history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                        Nenhum consumo registrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((entry: any) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                                        <TableCell>
                                            <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/service-orders/${entry.service_order_id}`)}>
                                                #{entry.service_order_id}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium text-red-600">
                                            -{Number(entry.metragem_used).toFixed(2)}m
                                        </TableCell>
                                        <TableCell className="text-muted-foreground italic">
                                            {entry.notes || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <RegisterConsumptionDialog
                bobbinId={bobbin.id}
                currentMetragem={bobbin.current_metragem}
                open={consumptionDialogOpen}
                onOpenChange={setConsumptionDialogOpen}
            />
        </div>
    );
}
