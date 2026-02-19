import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilmBobbins, useBobbinAlerts } from '@/hooks/useFilmBobbins';
import { useStores } from '@/hooks/useStores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Eye, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BobbinStockStatus } from '@/components/features/inventory/BobbinStockStatus';
import { BobbinAlertsPanel } from '@/components/features/inventory/BobbinAlertsPanel';
import { FILM_TYPES } from '@/types/inventory.types';
import type { FilmBobbinStatus } from '@/types/inventory.types';

export default function InventoryPage() {
    const navigate = useNavigate();
    const { selectedStoreId } = useStores();
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const [statusFilter, setStatusFilter] = useState<FilmBobbinStatus | 'all'>('all');
    const [filmTypeFilter, setFilmTypeFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [alertsOpen, setAlertsOpen] = useState(false);

    useEffect(() => {
        setPage(0);
    }, [selectedStoreId]);

    const { data, isLoading, isError } = useFilmBobbins(
        {
            store_id: selectedStoreId || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            film_type: filmTypeFilter === 'all' ? undefined : filmTypeFilter,
            search: search || undefined,
        },
        page * pageSize,
        pageSize
    );

    // Fetch alerts for count
    const { data: alerts } = useBobbinAlerts(selectedStoreId || undefined);
    const alertList = Array.isArray(alerts) ? alerts : (alerts as any)?.alerts || [];
    const criticalCount = alertList.filter((a: any) => a.alert_level === 'critical').length;

    // Mock summary data (would come from analytics or separate endpoint in real app, except critical)
    const summary = {
        total: data?.total || 0,
        critical: criticalCount, // Real critical count from alerts hook
        total_meters: data?.items.reduce((acc, curr) => acc + Number(curr.current_metragem), 0) || 0,
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const STATUS_LABELS: Record<string, string> = {
        available: 'Disponível',
        in_use: 'Em Uso',
        finished: 'Finalizada',
    };

    const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
        available: 'default',
        in_use: 'secondary',
        finished: 'outline',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventário de Películas</h1>
                    <p className="text-muted-foreground">
                        Gerencie o estoque de bobinas e controle o consumo.
                    </p>
                </div>
                <Button onClick={() => navigate('/inventory/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Bobina
                </Button>
            </div>

            {/* Metricas */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Bobinas</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setAlertsOpen(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${summary.critical > 0 ? 'text-red-500' : 'text-yellow-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.critical > 0 ? 'text-red-600' : ''}`}>
                            {alertList.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.critical} crítico(s) - Clique para ver
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Metragem Total (Pág.)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_meters.toFixed(2)}m</div>
                        <p className="text-xs text-muted-foreground">Visível nesta página</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/95 p-4 rounded-lg border">
                <div className="flex flex-1 items-center gap-2 w-full flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por SMART ID..."
                            className="pl-8"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <Select value={filmTypeFilter} onValueChange={setFilmTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Tipo de Película" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Tipos</SelectItem>
                            {Object.entries(FILM_TYPES).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="available">Disponível</SelectItem>
                            <SelectItem value="in_use">Em Uso</SelectItem>
                            <SelectItem value="finished">Finalizada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabela */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SMART ID</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Original</TableHead>
                            <TableHead>Restante</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-red-500">
                                    Erro ao carregar inventário.
                                </TableCell>
                            </TableRow>
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    Nenhuma bobina encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((bobbin) => (
                                <TableRow key={bobbin.id}>
                                    <TableCell className="font-mono font-medium">{bobbin.smart_id}</TableCell>
                                    <TableCell>{FILM_TYPES[bobbin.film_type as keyof typeof FILM_TYPES] || bobbin.film_type}</TableCell>
                                    <TableCell>{bobbin.supplier || '-'}</TableCell>
                                    <TableCell>{bobbin.nominal_metragem.toFixed(2)}m</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{bobbin.current_metragem.toFixed(2)}m</span>
                                            <span className="text-xs text-muted-foreground">
                                                {((bobbin.current_metragem / bobbin.nominal_metragem) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={STATUS_VARIANTS[bobbin.status] || 'default'}>
                                                {STATUS_LABELS[bobbin.status] || bobbin.status}
                                            </Badge>
                                            <BobbinStockStatus
                                                nominalMetragem={bobbin.nominal_metragem}
                                                currentMetragem={bobbin.current_metragem}
                                                status={bobbin.status}
                                                showLabel={false}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link to={`/inventory/${bobbin.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => Math.max(0, old - 1))}
                    disabled={page === 0 || isLoading}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => old + 1)}
                    disabled={!data || data.items.length < pageSize || isLoading}
                >
                    Próximo
                </Button>
            </div>

            {/* Alerts Dialog */}
            <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Monitoramento de Estoque</DialogTitle>
                        <DialogDescription>
                            Bobinas com nível de estoque baixo ou crítico.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <BobbinAlertsPanel />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
