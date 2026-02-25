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
import { Plus, Search, Eye, Package, AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BobbinStockStatus } from '@/components/features/inventory/BobbinStockStatus';
import { BobbinAlertsPanel } from '@/components/features/inventory/BobbinAlertsPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

    const STATUS_STYLES: Record<string, string> = {
        available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        in_use:    'bg-blue-100    text-blue-700    border-blue-200',
        finished:  'bg-gray-100    text-gray-500    border-gray-200',
    };

    return (
        <div className="space-y-5 page-enter">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-aems-primary-400/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-aems-primary-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-aems-neutral-700 tracking-tight">Inventário de Películas</h1>
                        <p className="text-sm text-aems-neutral-400">
                            {data?.total != null ? `${data.total} bobinas encontradas` : 'Controle o estoque e consumo de bobinas'}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => navigate('/inventory/new')}
                    className="bg-aems-primary-400 hover:bg-aems-primary-500 text-aems-neutral-900 font-semibold gap-2"
                >
                    <Plus className="h-4 w-4" />
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
            <div className="rounded-xl border border-aems-neutral-150 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-aems-neutral-50 hover:bg-aems-neutral-50">
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">SMART ID</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Tipo</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Fornecedor</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Original</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Restante</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Status</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 7 }).map((__, j) => (
                                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <div className="flex items-center justify-center gap-2 py-8 text-aems-error text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        Erro ao carregar inventário. Tente recarregar a página.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="p-0">
                                    <EmptyState
                                        icon={Package}
                                        title={search ? 'Nenhuma bobina encontrada' : 'Sem bobinas cadastradas'}
                                        description={search
                                            ? `Nenhum resultado para "${search}".`
                                            : 'Adicione bobinas de película para controlar o estoque.'}
                                        actionLabel={!search ? 'Nova Bobina' : undefined}
                                        onAction={!search ? () => navigate('/inventory/new') : undefined}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((bobbin) => (
                                <TableRow key={bobbin.id} className="hover:bg-aems-neutral-50/50 transition-colors">
                                    <TableCell className="font-mono font-bold text-xs text-aems-neutral-700 tracking-wider">
                                        {bobbin.smart_id}
                                    </TableCell>
                                    <TableCell className="text-sm text-aems-neutral-600">
                                        {FILM_TYPES[bobbin.film_type as keyof typeof FILM_TYPES] || bobbin.film_type}
                                    </TableCell>
                                    <TableCell className="text-sm text-aems-neutral-500">{bobbin.supplier || '—'}</TableCell>
                                    <TableCell className="text-sm font-medium text-aems-neutral-600">{bobbin.nominal_metragem.toFixed(2)}m</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold text-aems-neutral-700">{bobbin.current_metragem.toFixed(2)}m</span>
                                            <span className={cn(
                                                'text-[10px] font-medium',
                                                (bobbin.current_metragem / bobbin.nominal_metragem) < 0.2
                                                    ? 'text-aems-error'
                                                    : (bobbin.current_metragem / bobbin.nominal_metragem) < 0.5
                                                    ? 'text-aems-warning'
                                                    : 'text-aems-neutral-400'
                                            )}>
                                                {((bobbin.current_metragem / bobbin.nominal_metragem) * 100).toFixed(0)}% restante
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                                                STATUS_STYLES[bobbin.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                                            )}>
                                                {STATUS_LABELS[bobbin.status] || bobbin.status}
                                            </span>
                                            <BobbinStockStatus
                                                nominalMetragem={bobbin.nominal_metragem}
                                                currentMetragem={bobbin.current_metragem}
                                                status={bobbin.status}
                                                showLabel={false}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            className="hover:bg-aems-neutral-100 text-aems-neutral-500 hover:text-aems-neutral-700"
                                        >
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
