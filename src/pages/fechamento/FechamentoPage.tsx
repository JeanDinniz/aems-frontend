import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import { serviceOrdersService } from '@/services/api/service-orders.service';
import { useAuthStore } from '@/stores/auth.store';
import { useStoreStore } from '@/stores/store.store';
import type { ServiceOrder } from '@/types/service-order.types';
import { DEPARTMENTS, DEPARTMENTS_MAP } from '@/constants/service-orders';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSpreadsheet, Download, ChevronDown, ChevronRight } from 'lucide-react';

function formatDateBR(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcTotal(order: ServiceOrder & { items?: Array<{ unit_price?: number; quantity?: number }> }): number {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
        const price = (item as { unit_price?: number }).unit_price ?? 0;
        const qty = item.quantity ?? 1;
        return sum + price * qty;
    }, 0);
}

export function FechamentoPage() {
    const user = useAuthStore((s) => s.user);
    const { selectedStoreId, availableStores } = useStoreStore();
    const [isExporting, setIsExporting] = useState(false);

    // Period state — default current month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0];

    const [storeId, setStoreId] = useState<number>(
        selectedStoreId ?? user?.store_id ?? availableStores[0]?.id ?? 0
    );
    const [dateFrom, setDateFrom] = useState(firstOfMonth);
    const [dateTo, setDateTo] = useState(lastOfMonth);
    const [department, setDepartment] = useState<string>('');
    const [courtesyOnly, setCourtesyOnly] = useState(false);
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

    const selectedStore = availableStores.find((s) => s.id === storeId);

    const { data, isLoading } = useQuery({
        queryKey: ['service-orders', 'fechamento', storeId, dateFrom, dateTo, department, courtesyOnly],
        queryFn: () => serviceOrdersService.getFiltered({
            store_id: storeId || undefined,
            is_verified: true,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            department: department || undefined,
            is_courtesy: courtesyOnly ? true : undefined,
            limit: 9999,
        }),
        enabled: !!storeId,
    });

    const orders = data?.items ?? [];

    // Group by department with full order details
    const groupedDetailed = useMemo(() => {
        const map = new Map<string, { label: string; orders: typeof orders; count: number; total: number }>();
        for (const order of orders) {
            const dept = order.department as string;
            const existing = map.get(dept) ?? {
                label: DEPARTMENTS_MAP[dept as keyof typeof DEPARTMENTS_MAP] ?? dept,
                orders: [] as typeof orders,
                count: 0,
                total: 0,
            };
            const val = calcTotal(order);
            map.set(dept, { ...existing, orders: [...existing.orders, order], count: existing.count + 1, total: existing.total + val });
        }
        return Array.from(map.values());
    }, [orders]);

    const grandTotal = groupedDetailed.reduce((sum, g) => sum + g.total, 0);
    const grandCount = groupedDetailed.reduce((sum, g) => sum + g.count, 0);

    useEffect(() => {
        setExpandedDepts(new Set(groupedDetailed.map((_, i) => i.toString())));
    }, [groupedDetailed.length]);

    const toggleDept = (key: string) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const storeName = selectedStore?.name ?? `Loja #${storeId}`;

    const handleExport = async () => {
        setIsExporting(true);
        const fileName = `fechamento_${storeName.replace(/\s/g, '_')}_${dateFrom}_${dateTo}.xlsx`;

        try {
            const response = await apiClient.get('/service-orders/export/fechamento', {
                params: {
                    store_id: storeId || undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                    department: department || undefined,
                    is_courtesy: courtesyOnly ? true : undefined,
                },
                responseType: 'blob',
            });
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erro ao exportar fechamento:', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6" style={{ color: '#F5A800' }} />
                    <div>
                        <h1
                            className="text-[#111111] dark:text-white text-2xl font-bold"
                            style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                        >
                            Fechamento
                        </h1>
                        <p className="text-sm text-[#666666] dark:text-zinc-400">
                            Extrato financeiro de OS verificadas
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={orders.length === 0 || isExporting}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Exportando...' : 'Exportar Excel'}
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] rounded-xl">
                {availableStores.length > 1 && (
                    <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-400">Loja</Label>
                        <Select
                            value={storeId.toString()}
                            onValueChange={(v) => setStoreId(Number(v))}
                        >
                            <SelectTrigger className="w-52 bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                <SelectValue placeholder="Selecionar loja" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                {availableStores.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()} className="focus:bg-zinc-700 focus:text-white">
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-400">Data início</Label>
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-40 bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus-visible:ring-[#F5A800] dark:[color-scheme:dark]"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-400">Data fim</Label>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-40 bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus-visible:ring-[#F5A800] dark:[color-scheme:dark]"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-400">Departamento</Label>
                    <Select
                        value={department || 'all'}
                        onValueChange={(v) => setDepartment(v === 'all' ? '' : v)}
                    >
                        <SelectTrigger className="w-40 bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                            <SelectItem value="all" className="focus:bg-zinc-700 focus:text-white">Todos</SelectItem>
                            {DEPARTMENTS.map((d) => (
                                <SelectItem key={d.value} value={d.value} className="focus:bg-zinc-700 focus:text-white">
                                    {d.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="block text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-400">Cortesia</Label>
                    <button
                        onClick={() => setCourtesyOnly((v) => !v)}
                        className={`block h-9 px-4 rounded-lg text-sm font-semibold border transition-all ${
                            courtesyOnly
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white hover:border-amber-400'
                        }`}
                    >
                        Somente Cortesia
                    </button>
                </div>
            </div>

            {/* Summary info */}
            {!isLoading && (
                <p className="text-sm text-[#666666] dark:text-zinc-400">
                    {grandCount} OS verificadas encontradas para <strong className="text-[#111111] dark:text-zinc-200">{storeName}</strong> no período {dateFrom} a {dateTo}
                </p>
            )}

            {/* Seções expansíveis por departamento */}
            <div className="space-y-2">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl p-4">
                            <Skeleton className="h-5 w-48 bg-gray-200 dark:bg-zinc-800 animate-pulse rounded" />
                        </div>
                    ))
                ) : groupedDetailed.length === 0 ? (
                    <div className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl px-4 py-12 text-center text-[#999999] dark:text-zinc-500">
                        Nenhuma OS verificada encontrada para o período selecionado
                    </div>
                ) : (
                    groupedDetailed.map((group, idx) => {
                        const key = idx.toString();
                        const isOpen = expandedDepts.has(key);
                        return (
                            <div key={group.label} className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden">
                                {/* Cabeçalho clicável */}
                                <button
                                    onClick={() => toggleDept(key)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-zinc-800/60 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {isOpen
                                            ? <ChevronDown className="h-4 w-4 text-[#666666] dark:text-zinc-400" />
                                            : <ChevronRight className="h-4 w-4 text-[#666666] dark:text-zinc-400" />}
                                        <span className="font-semibold text-[#111111] dark:text-white">{group.label}</span>
                                        <span className="text-xs text-[#666666] dark:text-zinc-400 ml-1">{group.count} OS</span>
                                    </div>
                                    <span className="font-bold tabular-nums" style={{ color: '#F5A800' }}>
                                        {formatCurrency(group.total)}
                                    </span>
                                </button>

                                {/* Tabela de OS */}
                                {isOpen && (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-t border-[#E8E8E8] dark:border-[#333333] bg-gray-50 dark:bg-zinc-800/30">
                                                <th className="text-left px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Data</th>
                                                <th className="text-left px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Placa</th>
                                                <th className="text-left px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Nº OS</th>
                                                <th className="text-left px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Cortesia</th>
                                                <th className="text-left px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Serviços</th>
                                                <th className="text-right px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.orders.map((order) => {
                                                const orderAny = order as typeof order & { is_courtesy?: boolean };
                                                const serviceNames = order.items
                                                    ?.map((i) => i.service_name)
                                                    .filter(Boolean)
                                                    .join(', ') || '—';
                                                return (
                                                    <tr
                                                        key={order.id}
                                                        className="border-t border-[#E8E8E8] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors"
                                                    >
                                                        <td className="px-4 py-2 text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                                                            {formatDateBR(order.service_date ?? order.created_at)}
                                                        </td>
                                                        <td className="px-4 py-2 font-mono text-[#111111] dark:text-zinc-200">
                                                            {order.plate}
                                                        </td>
                                                        <td className="px-4 py-2 text-[#111111] dark:text-zinc-200">
                                                            {order.order_number}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {orderAny.is_courtesy ? (
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                                                                    Sim
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-[#999999] dark:text-zinc-500">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-[#666666] dark:text-zinc-400 max-w-xs">
                                                            <span className="line-clamp-1" title={serviceNames}>{serviceNames}</span>
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium tabular-nums text-[#111111] dark:text-zinc-200">
                                                            {formatCurrency(calcTotal(order))}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Total Geral */}
                {!isLoading && grandCount > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-2 border-[#F5A800]/30 bg-gray-100 dark:bg-zinc-800/80 rounded-xl">
                        <span className="font-bold text-[#111111] dark:text-zinc-100">
                            TOTAL GERAL — {grandCount} OS
                        </span>
                        <span className="font-bold tabular-nums text-lg" style={{ color: '#F5A800' }}>
                            {formatCurrency(grandTotal)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
