import { useState } from 'react';
import { useServiceOrders, useUpdateServiceOrderStatus } from '@/hooks/useServiceOrders';
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
import { Search, ClipboardList, AlertCircle, Zap, Pencil } from 'lucide-react';
import { QuickCreateModal } from '@/components/features/service-orders/QuickCreateModal';
import { EditServicesModal } from '@/components/features/service-orders/EditServicesModal';
import { EmptyState } from '@/components/common/EmptyState';
import type { Department, ServiceOrder } from '@/types/service-order.types';
import { DEPARTMENTS_MAP } from '@/constants/service-orders';

const STATUS_COLORS: Record<string, string> = {
    waiting: 'border-[#D1D1D1] text-[#666666]',
    doing:   'border-[#F5A800] text-[#F5A800]',
    ready:   'border-[#22c55e] text-[#22c55e]',
};

export default function ServiceOrdersPage() {
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const [quickCreateOpen, setQuickCreateOpen] = useState(true);
    const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

    const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>('all');
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;

    const updateStatus = useUpdateServiceOrderStatus();

    const { selectedStoreId } = useStoreStore();

    const { data, isLoading, isError } = useServiceOrders(
        {
            store_id: selectedStoreId ?? undefined,
            search: search || undefined,
            department: departmentFilter !== 'all' ? departmentFilter : undefined,
            date_from: selectedDate,
            date_to: selectedDate,
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5A800]/15 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" style={{ color: '#F5A800' }} />
                    </div>
                    <div>
                        <h1
                            className="text-xl font-bold text-[#111111] dark:text-white tracking-tight"
                            style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                        >
                            Ordens de Serviço
                        </h1>
                        <p className="text-sm text-[#666666] dark:text-zinc-400">
                            {data?.total != null ? `${data.total} registros encontrados` : 'Gerencie todas as ordens do sistema'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setQuickCreateOpen(true)}
                        className="font-semibold gap-2 bg-transparent"
                        style={{ borderColor: '#F5A800', color: '#F5A800' }}
                    >
                        <Zap className="h-4 w-4" />
                        Lançar OS
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 items-center gap-2 w-full flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#999999] dark:text-zinc-500" />
                        <Input
                            placeholder="Buscar por placa ou nº OS..."
                            value={search}
                            onChange={handleSearch}
                            className="h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] pl-8 pr-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] placeholder:text-[#999999] dark:placeholder:text-zinc-600"
                        />
                    </div>

                    <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val as Department | 'all')}>
                        <SelectTrigger className="w-full sm:w-[150px] bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-zinc-300 focus:ring-[#F5A800] focus:border-[#F5A800]">
                            <SelectValue placeholder="Departamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-zinc-200">
                            <SelectItem value="all">Todos Depts</SelectItem>
                            <SelectItem value="film">Película</SelectItem>
                            <SelectItem value="ppf">PPF</SelectItem>
                            <SelectItem value="vn">VN</SelectItem>
                            <SelectItem value="vu">VU</SelectItem>
                            <SelectItem value="bodywork">Funilaria</SelectItem>
                            <SelectItem value="workshop">Oficina</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                            Data
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setPage(0);
                            }}
                            className="h-10 rounded-md border border-[#D1D1D1] bg-white dark:bg-[#1A1A1A] dark:border-[#333333] px-3 text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#F5A800]"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800/60 border-0">
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Ações</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Nº OS Conc.</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Placa</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Veículo</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Departamento</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Serviços</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-t border-[#E8E8E8] dark:border-[#333333]">
                                    {Array.from({ length: 7 }).map((__, j) => (
                                        <TableCell key={j} className="px-4 py-3">
                                            <Skeleton className="h-5 w-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : isError ? (
                            <TableRow className="border-t border-[#E8E8E8] dark:border-[#333333]">
                                <TableCell colSpan={7} className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2 py-8 text-red-400 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        Erro ao carregar ordens de serviço. Tente recarregar a página.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.items.length === 0 ? (
                            <TableRow className="border-t border-[#E8E8E8] dark:border-[#333333]">
                                <TableCell colSpan={7} className="p-0">
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
                                <TableRow key={os.id} className="border-t border-[#E8E8E8] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors">
                                    {/* Ações */}
                                    <TableCell className="px-4 py-3">
                                        <button
                                            onClick={() => setEditingOrder(os)}
                                            disabled={!isToday}
                                            className={[
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors',
                                                isToday
                                                    ? 'border-[#F5A800] text-[#F5A800] hover:bg-[#F5A800]/10 cursor-pointer'
                                                    : 'border-[#D1D1D1] text-[#BBBBBB] dark:border-[#444444] dark:text-[#555555] opacity-50 cursor-not-allowed',
                                            ].join(' ')}
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Editar
                                        </button>
                                    </TableCell>
                                    {/* Status */}
                                    <TableCell className="px-4 py-3">
                                        <Select
                                            value={os.status}
                                            onValueChange={(value) =>
                                                updateStatus.mutate({ id: os.id, status: value })
                                            }
                                        >
                                            <SelectTrigger
                                                className={[
                                                    'h-8 w-36 rounded-md border bg-white dark:bg-[#252525] px-2 text-xs font-semibold focus:ring-1 focus:ring-[#F5A800] focus:border-[#F5A800] cursor-pointer',
                                                    STATUS_COLORS[os.status] ?? 'border-[#D1D1D1] text-[#666666]',
                                                ].join(' ')}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white rounded-lg shadow-lg">
                                                <SelectItem value="waiting" className="text-xs font-semibold text-[#666666] dark:text-zinc-400 focus:bg-zinc-100 dark:focus:bg-zinc-800">Aguardando</SelectItem>
                                                <SelectItem value="doing" className="text-xs font-semibold text-[#F5A800] focus:bg-zinc-100 dark:focus:bg-zinc-800">Desenvolvendo</SelectItem>
                                                <SelectItem value="ready" className="text-xs font-semibold text-[#22c55e] focus:bg-zinc-100 dark:focus:bg-zinc-800">Finalizado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200 font-mono text-xs">{os.external_os_number || '—'}</TableCell>
                                    <TableCell className="px-4 py-3">
                                        <span className="bg-gray-100 dark:bg-zinc-800 border border-[#D1D1D1] dark:border-zinc-700 text-[#111111] dark:text-white font-mono px-2 py-0.5 rounded text-sm tracking-widest">
                                            {os.plate}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200">
                                        {os.vehicle_model}{os.vehicle_color ? ` · ${os.vehicle_color}` : ''}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge variant="outline" className="border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-400 text-xs">
                                            {DEPARTMENTS_MAP[os.department] || os.department}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(os.items ?? [])
                                                .filter(item => item.service_name)
                                                .map((item, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-block text-xs bg-muted px-1.5 py-0.5 rounded"
                                                    >
                                                        {item.service_name}
                                                    </span>
                                                ))
                                            }
                                            {(!os.items || os.items.filter(item => item.service_name).length === 0) && (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => Math.max(0, old - 1))}
                    disabled={page === 0 || isLoading}
                    className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent"
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => old + 1)}
                    disabled={!data || data.items.length < pageSize || isLoading}
                    className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent"
                >
                    Próximo
                </Button>
            </div>

            <QuickCreateModal
                open={quickCreateOpen}
                onClose={() => setQuickCreateOpen(false)}
            />

            {editingOrder && (
                <EditServicesModal
                    serviceOrder={editingOrder}
                    open={!!editingOrder}
                    onClose={() => setEditingOrder(null)}
                />
            )}
        </div>
    );
}
