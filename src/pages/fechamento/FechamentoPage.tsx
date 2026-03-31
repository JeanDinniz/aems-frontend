import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { serviceOrdersService } from '@/services/api/service-orders.service';
import { useAuthStore } from '@/stores/auth.store';
import { useStoreStore } from '@/stores/store.store';
import type { ServiceOrder } from '@/types/service-order.types';
import { DEPARTMENTS_MAP } from '@/constants/service-orders';
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
import { FileSpreadsheet, Download } from 'lucide-react';

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

interface GroupedSummary {
    department: string;
    label: string;
    count: number;
    total: number;
}

export function FechamentoPage() {
    const user = useAuthStore((s) => s.user);
    const { selectedStoreId, availableStores } = useStoreStore();

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

    const selectedStore = availableStores.find((s) => s.id === storeId);

    const { data, isLoading } = useQuery({
        queryKey: ['service-orders', 'fechamento', storeId, dateFrom, dateTo],
        queryFn: () => serviceOrdersService.getFiltered({
            store_id: storeId || undefined,
            is_verified: true,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            limit: 9999,
        }),
        enabled: !!storeId,
    });

    const orders = data?.items ?? [];

    // Group by department
    const grouped = useMemo((): GroupedSummary[] => {
        const map = new Map<string, { count: number; total: number }>();
        for (const order of orders) {
            const dept = order.department;
            const existing = map.get(dept) ?? { count: 0, total: 0 };
            map.set(dept, {
                count: existing.count + 1,
                total: existing.total + calcTotal(order),
            });
        }
        return Array.from(map.entries()).map(([dept, { count, total }]) => ({
            department: dept,
            label: DEPARTMENTS_MAP[dept as keyof typeof DEPARTMENTS_MAP] ?? dept,
            count,
            total,
        }));
    }, [orders]);

    const grandTotal = grouped.reduce((sum, g) => sum + g.total, 0);
    const grandCount = grouped.reduce((sum, g) => sum + g.count, 0);

    const storeName = selectedStore?.name ?? `Loja #${storeId}`;

    const handleExport = () => {
        const rows: (string | number)[][] = [
            ['AEMS - Fechamento'],
            [`Loja: ${storeName} | Período: ${dateFrom} – ${dateTo}`],
            [],
            ['Departamento', 'Qtd OS', 'Valor Total'],
            ...grouped.map((g) => [g.label, g.count, g.total]),
            [],
            ['TOTAL GERAL', grandCount, grandTotal],
        ];

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fechamento');
        XLSX.writeFile(wb, `fechamento_${storeName.replace(/\s/g, '_')}_${dateFrom}_${dateTo}.xlsx`);
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
                    disabled={orders.length === 0}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                >
                    <Download className="h-4 w-4" />
                    Exportar Excel
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
            </div>

            {/* Summary info */}
            {!isLoading && (
                <p className="text-sm text-[#666666] dark:text-zinc-400">
                    {grandCount} OS verificadas encontradas para <strong className="text-[#111111] dark:text-zinc-200">{storeName}</strong> no período {dateFrom} a {dateTo}
                </p>
            )}

            {/* Grouped table */}
            <div className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-zinc-800/60">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Departamento</th>
                            <th className="text-right px-4 py-3 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Qtd OS</th>
                            <th className="text-right px-4 py-3 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="border-t border-[#E8E8E8] dark:border-[#333333]">
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 animate-pulse rounded" /></td>
                                    <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-8 ml-auto bg-gray-200 dark:bg-zinc-800 animate-pulse rounded" /></td>
                                    <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-20 ml-auto bg-gray-200 dark:bg-zinc-800 animate-pulse rounded" /></td>
                                </tr>
                            ))
                        ) : grouped.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-12 text-center text-[#999999] dark:text-zinc-500">
                                    Nenhuma OS verificada encontrada para o período selecionado
                                </td>
                            </tr>
                        ) : (
                            grouped.map((g) => (
                                <tr key={g.department} className="border-t border-[#E8E8E8] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors">
                                    <td className="px-4 py-3 text-[#111111] dark:text-zinc-200 font-medium">{g.label}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-[#111111] dark:text-zinc-200">{g.count}</td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums text-[#111111] dark:text-zinc-200">
                                        {formatCurrency(g.total)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {!isLoading && grouped.length > 0 && (
                        <tfoot>
                            <tr className="border-t-2 border-[#F5A800]/30 bg-gray-100 dark:bg-zinc-800/80 font-bold">
                                <td className="px-4 py-3 text-[#111111] dark:text-zinc-100">TOTAL GERAL</td>
                                <td className="px-4 py-3 text-right tabular-nums text-[#111111] dark:text-zinc-100">{grandCount}</td>
                                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#F5A800' }}>
                                    {formatCurrency(grandTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
