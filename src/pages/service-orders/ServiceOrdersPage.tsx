import { useState } from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { useStoreStore } from '@/stores/store.store';
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
import { Search, ClipboardList, AlertCircle, Zap } from 'lucide-react';
import { QuickCreateModal } from '@/components/features/service-orders/QuickCreateModal';
import { EmptyState } from '@/components/common/EmptyState';
import type { Department } from '@/types/service-order.types';
import { DEPARTMENTS_MAP } from '@/constants/service-orders';

export default function ServiceOrdersPage() {
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const [quickCreateOpen, setQuickCreateOpen] = useState(true);

    const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>('all');
    const [search, setSearch] = useState('');

    const { selectedStoreId } = useStoreStore();

    const { data, isLoading, isError } = useServiceOrders(
        {
            store_id: selectedStoreId ?? undefined,
            search: search || undefined,
        },
        page * pageSize,
        pageSize
    );

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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setQuickCreateOpen(true)}
                        className="border-aems-primary-400 text-aems-primary-600 hover:bg-aems-primary-50 font-semibold gap-2"
                    >
                        <Zap className="h-4 w-4" />
                        Lançar OS
                    </Button>

                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/95 p-4 rounded-lg border">
                <div className="flex flex-1 items-center gap-2 w-full flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por placa ou nº OS..."
                            className="pl-8"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val as Department | 'all')}>
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
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Veículo</TableHead>
                            <TableHead className="text-xs font-semibold text-aems-neutral-500 uppercase tracking-wide">Departamento</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 4 }).map((__, j) => (
                                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <div className="flex items-center justify-center gap-2 py-8 text-aems-error text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        Erro ao carregar ordens de serviço. Tente recarregar a página.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="p-0">
                                    <EmptyState
                                        icon={ClipboardList}
                                        title={search ? 'Nenhuma O.S. encontrada' : 'Nenhuma ordem de serviço'}
                                        description={search
                                            ? `Nenhum resultado para "${search}". Tente outros termos.`
                                            : 'Comece criando uma nova ordem de serviço.'}
                                        actionLabel={!search ? 'Lançar OS' : undefined}
                                        onAction={!search ? () => setQuickCreateOpen(true) : undefined}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((os) => (
                                <TableRow key={os.id} className="hover:bg-aems-neutral-50/50 transition-colors">
                                    <TableCell className="font-mono text-xs text-aems-neutral-500">{os.external_os_number || '—'}</TableCell>
                                    <TableCell className="font-mono font-bold text-aems-neutral-700 tracking-widest">{os.plate}</TableCell>
                                    <TableCell className="text-sm text-aems-neutral-600">
                                        {os.vehicle_model}{os.vehicle_color ? ` · ${os.vehicle_color}` : ''}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs font-medium border-aems-neutral-200 text-aems-neutral-600">
                                            {DEPARTMENTS_MAP[os.department] || os.department}
                                        </Badge>
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

            <QuickCreateModal
                open={quickCreateOpen}
                onClose={() => setQuickCreateOpen(false)}
            />
        </div>
    );
}
