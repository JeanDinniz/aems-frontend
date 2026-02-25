import { useState } from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { useStores } from '@/hooks/useStores';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, ClipboardList, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { TrafficLightStatus } from '@/components/features/service-orders/TrafficLightStatus';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { ServiceOrderStatus, Department } from '@/types/service-order.types';

export default function ServiceOrdersPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { stores, selectedStoreId } = useStores();
    const [page, setPage] = useState(0);
    const pageSize = 10;

    // Show "Cliente" column only for Wash Center (direct_sales) stores
    const currentStore = selectedStoreId
        ? stores.find(s => s.id === selectedStoreId)
        : stores.length === 1 ? stores[0] : null;
    const isWashCenter = currentStore?.store_type === 'direct_sales'
        || (user?.role === 'owner' && !selectedStoreId); // owner viewing all: show column
    const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | 'all'>('all');
    const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>('all');
    const [search, setSearch] = useState('');

    const { data, isLoading, isError } = useServiceOrders(
        {
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: search || undefined,
            // Add department filter to hook/service if backend supports it. For now assume hook passes extra params or ignores.
        },
        page * pageSize,
        pageSize
    );

    const STATUS_LABELS: Record<string, string> = {
        waiting: 'Aguardando',
        doing: 'Fazendo',
        inspection: 'Inspeção',
        ready: 'Pronto',
        delivered: 'Entregue',
    };

    const STATUS_STYLES: Record<string, string> = {
        waiting:    'bg-slate-100    text-slate-700  border-slate-200',
        doing:      'bg-blue-100     text-blue-700   border-blue-200',
        inspection: 'bg-purple-100   text-purple-700 border-purple-200',
        ready:      'bg-emerald-100  text-emerald-700 border-emerald-200',
        delivered:  'bg-gray-100     text-gray-600   border-gray-200',
    };

    const DEPARTMENTS: Record<string, string> = {
        film: 'Película',
        ppf: 'PPF',
        vn: 'VN',
        vu: 'VU',
        bodywork: 'Funilaria',
        workshop: 'Oficina'
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0);
    };

    return (
        <div className="space-y-5 page-enter">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-aems-neutral-700 tracking-tight">Ordens de Serviço</h1>
                        <p className="text-sm text-aems-neutral-400">
                            {data?.total != null ? `${data.total} registros encontrados` : 'Gerencie todas as ordens do sistema'}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => navigate('/service-orders/new')}
                    className="bg-aems-primary-400 hover:bg-aems-primary-500 text-aems-neutral-900 font-semibold gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Nova O.S.
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/95 p-4 rounded-lg border">
                <div className="flex flex-1 items-center gap-2 w-full flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente, veículo ou OS..."
                            className="pl-8"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="waiting">Aguardando</SelectItem>
                            <SelectItem value="doing">Fazendo</SelectItem>
                            <SelectItem value="inspection">Inspeção</SelectItem>
                            <SelectItem value="ready">Pronto</SelectItem>
                            <SelectItem value="delivered">Entregue</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val as any)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Departamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Depts</SelectItem>
                            <SelectItem value="film">Película</SelectItem>
                            <SelectItem value="ppf">PPF</SelectItem>
                            <SelectItem value="vn">VN</SelectItem>
                            <SelectItem value="vu">VU</SelectItem>
                            <SelectItem value="bodywork">Funilaria</SelectItem>
                            <SelectItem value="workshop">Oficina</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-xl border border-aems-neutral-150 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-aems-neutral-50 hover:bg-aems-neutral-50">
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Nº OS Conc.</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Placa</TableHead>
                            {isWashCenter && <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Cliente</TableHead>}
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Veículo</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Departamento</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Semáforo</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: isWashCenter ? 8 : 7 }).map((__, j) => (
                                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={isWashCenter ? 8 : 7}>
                                    <div className="flex items-center justify-center gap-2 py-8 text-aems-error text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        Erro ao carregar ordens de serviço. Tente recarregar a página.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isWashCenter ? 8 : 7} className="p-0">
                                    <EmptyState
                                        icon={ClipboardList}
                                        title={search ? 'Nenhuma O.S. encontrada' : 'Nenhuma ordem de serviço'}
                                        description={search
                                            ? `Nenhum resultado para "${search}". Tente outros termos.`
                                            : 'Comece criando uma nova ordem de serviço.'}
                                        actionLabel={!search ? 'Nova O.S.' : undefined}
                                        onAction={!search ? () => navigate('/service-orders/new') : undefined}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((os) => (
                                <TableRow key={os.id} className="hover:bg-aems-neutral-50/50 transition-colors">
                                    <TableCell className="font-mono text-xs text-aems-neutral-500">{os.external_os_number || '—'}</TableCell>
                                    <TableCell className="font-mono font-bold text-aems-neutral-700 tracking-widest">{os.plate}</TableCell>
                                    {isWashCenter && <TableCell className="text-sm text-aems-neutral-600">{os.client_name}</TableCell>}
                                    <TableCell className="text-sm text-aems-neutral-600">
                                        {os.vehicle_model}{os.vehicle_color ? ` · ${os.vehicle_color}` : ''}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs font-medium border-aems-neutral-200 text-aems-neutral-600">
                                            {DEPARTMENTS[os.department] || os.department}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                                            STATUS_STYLES[os.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                                        )}>
                                            {STATUS_LABELS[os.status] || os.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <TrafficLightStatus
                                            entryTime={os.entry_time || os.created_at}
                                            department={os.department}
                                            status={os.status}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            className="hover:bg-aems-neutral-100 text-aems-neutral-500 hover:text-aems-neutral-700"
                                        >
                                            <Link to={`/service-orders/${os.id}`}>
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
        </div>
    );
}
