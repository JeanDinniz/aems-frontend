import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
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
import { FileSpreadsheet, Download, ChevronDown, ChevronRight, LayoutList } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDateBR(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type OrderWithItems = ServiceOrder & {
    items?: Array<{ unit_price?: number; quantity?: number; service_name?: string | null }>;
    is_courtesy?: boolean;
    is_galpon?: boolean;
};

function calcTotal(order: OrderWithItems): number {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
        return sum + (item.unit_price ?? 0) * (item.quantity ?? 1);
    }, 0);
}

function hasLavagemSimples(order: OrderWithItems): boolean {
    return (order.items ?? []).some(
        (i) => i.service_name && i.service_name.toLowerCase().includes('lavagem simples'),
    );
}

// ─── types ───────────────────────────────────────────────────────────────────

type ServiceGroup = {
    serviceName: string;
    orders: OrderWithItems[];
    count: number;
    total: number;
};

type DeptGroup = {
    deptKey: string;
    label: string;
    services: ServiceGroup[];
    count: number;
    total: number;
    /** Params to pass to the per-card download endpoint */
    exportParams: Record<string, string | boolean | number | undefined>;
};

// Ordem de exibição dos departamentos
const DEPT_ORDER = ['film', 'ppf', 'vn', 'vd', 'vu', 'bodywork', 'workshop_lavagem', 'workshop_courtesy'];

const VIRTUAL_LABELS: Record<string, string> = {
    workshop_courtesy: 'Oficina Cortesia',
    workshop_lavagem: 'Oficina Lavagem Simples',
};

// ─── component ───────────────────────────────────────────────────────────────

export function FechamentoPage() {
    const user = useAuthStore((s) => s.user);
    const { selectedStoreId, availableStores } = useStoreStore();
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingResumo, setIsExportingResumo] = useState(false);
    const [exportingCardKey, setExportingCardKey] = useState<string | null>(null);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [storeId, setStoreId] = useState<number>(
        selectedStoreId ?? user?.store_id ?? availableStores[0]?.id ?? 0,
    );
    const [dateFrom, setDateFrom] = useState(firstOfMonth);
    const [dateTo, setDateTo] = useState(lastOfMonth);

    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
    const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

    const selectedStore = availableStores.find((s) => s.id === storeId);
    const storeName = selectedStore?.name ?? `Loja #${storeId}`;

    const { data, isLoading } = useQuery({
        queryKey: ['service-orders', 'fechamento', storeId, dateFrom, dateTo],
        queryFn: () =>
            serviceOrdersService.getFiltered({
                store_id: storeId || undefined,
                is_verified: true,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                limit: 9999,
            }),
        enabled: true,
    });

    const orders = (data?.items ?? []) as OrderWithItems[];

    // ── agrupamento em dois níveis ──────────────────────────────────────────
    const groupedDetailed = useMemo<DeptGroup[]>(() => {
        const deptMap = new Map<string, Map<string, OrderWithItems[]>>();

        for (const order of orders) {
            const dept = order.department as string;
            let key: string;

            if (dept === 'workshop') {
                if (order.is_courtesy) {
                    key = 'workshop_courtesy';
                } else if (hasLavagemSimples(order)) {
                    key = 'workshop_lavagem';
                } else {
                    continue; // ignorar workshop que não é cortesia nem lavagem simples
                }
            } else {
                key = dept;
            }

            if (!deptMap.has(key)) deptMap.set(key, new Map());
            const serviceMap = deptMap.get(key)!;

            const items = order.items ?? [];
            if (items.length === 0) {
                const svcKey = '—';
                if (!serviceMap.has(svcKey)) serviceMap.set(svcKey, []);
                serviceMap.get(svcKey)!.push(order);
            } else {
                for (const item of items) {
                    const svcKey = item.service_name || '—';
                    if (!serviceMap.has(svcKey)) serviceMap.set(svcKey, []);
                    // Evitar duplicar a mesma OS em múltiplos serviços do mesmo grupo
                    if (!serviceMap.get(svcKey)!.some((o) => o.id === order.id)) {
                        serviceMap.get(svcKey)!.push(order);
                    }
                }
            }
        }

        const result: DeptGroup[] = [];

        for (const key of DEPT_ORDER) {
            const serviceMap = deptMap.get(key);
            if (!serviceMap) continue;

            const label = VIRTUAL_LABELS[key] ?? DEPARTMENTS_MAP[key as keyof typeof DEPARTMENTS_MAP] ?? key;

            const services: ServiceGroup[] = Array.from(serviceMap.entries()).map(
                ([serviceName, svcOrders]) => ({
                    serviceName,
                    orders: svcOrders,
                    count: svcOrders.length,
                    total: svcOrders.reduce((s, o) => s + calcTotal(o), 0),
                }),
            );

            // count e total únicos por OS (não duplicar por serviço)
            const uniqueOrders = Array.from(new Map(
                Array.from(serviceMap.values()).flat().map((o) => [o.id, o])
            ).values());
            const count = uniqueOrders.length;
            const total = uniqueOrders.reduce((s, o) => s + calcTotal(o), 0);

            // Params para download do card
            let exportParams: DeptGroup['exportParams'] = {
                store_id: storeId || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            };
            if (key === 'workshop_courtesy') {
                exportParams = { ...exportParams, department: 'workshop', is_courtesy: true };
            } else if (key === 'workshop_lavagem') {
                exportParams = {
                    ...exportParams,
                    department: 'workshop',
                    service_name_contains: 'Lavagem Simples',
                };
            } else {
                exportParams = { ...exportParams, department: key };
            }

            result.push({ deptKey: key, label, services, count, total, exportParams });
        }

        return result;
    }, [orders, storeId, dateFrom, dateTo]);

    const grandTotal = groupedDetailed.reduce((s, g) => s + g.total, 0);
    const grandCount = useMemo(() => {
        const allIds = new Set(orders.filter((o) => {
            const dept = o.department as string;
            if (dept !== 'workshop') return true;
            if (o.is_courtesy) return true;
            if (hasLavagemSimples(o)) return true;
            return false;
        }).map((o) => o.id));
        return allIds.size;
    }, [orders]);

    // Expandir todos os departamentos quando os dados chegam
    useEffect(() => {
        setExpandedDepts(new Set(groupedDetailed.map((g) => g.deptKey)));
    }, [groupedDetailed.length]);

    const toggleDept = (key: string) => {
        setExpandedDepts((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const toggleService = (key: string) => {
        setExpandedServices((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    // ── export handlers ─────────────────────────────────────────────────────

    const downloadBlob = (blobData: BlobPart, fileName: string) => {
        const blob = new Blob([blobData], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await apiClient.get('/service-orders/export/fechamento', {
                params: { store_id: storeId || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
                responseType: 'blob',
            });
            downloadBlob(response.data, `fechamento_${storeName.replace(/\s/g, '_')}_${dateFrom}_${dateTo}.xlsx`);
        } catch (err) {
            console.error('Erro ao exportar fechamento:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportResumo = async () => {
        setIsExportingResumo(true);
        try {
            const response = await apiClient.get('/service-orders/export/fechamento-resumo', {
                params: { store_id: storeId || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
                responseType: 'blob',
            });
            downloadBlob(response.data, `resumo_fechamento_${storeName.replace(/\s/g, '_')}_${dateFrom}_${dateTo}.xlsx`);
        } catch (err) {
            console.error('Erro ao exportar resumo:', err);
        } finally {
            setIsExportingResumo(false);
        }
    };

    const handleExportCard = async (group: DeptGroup) => {
        setExportingCardKey(group.deptKey);
        try {
            const response = await apiClient.get('/service-orders/export/fechamento', {
                params: group.exportParams,
                responseType: 'blob',
            });
            downloadBlob(
                response.data,
                `fechamento_${group.label.replace(/\s/g, '_')}_${storeName.replace(/\s/g, '_')}_${dateFrom}_${dateTo}.xlsx`,
            );
        } catch (err) {
            console.error('Erro ao exportar card:', err);
        } finally {
            setExportingCardKey(null);
        }
    };

    // ── render ───────────────────────────────────────────────────────────────

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
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportResumo}
                        disabled={orders.length === 0 || isExportingResumo}
                        title="Exportar resumo por departamento/serviço"
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition-all border border-[#F5A800] bg-transparent"
                        style={{ color: '#F5A800' }}
                    >
                        <LayoutList className="h-4 w-4" />
                        {isExportingResumo ? 'Exportando...' : 'Exportar Resumo'}
                    </button>
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
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 p-4 bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] rounded-xl">
                {availableStores.length > 1 && (
                    <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-400">Loja</Label>
                        <Select value={storeId.toString()} onValueChange={(v) => setStoreId(Number(v))}>
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
                    {grandCount} OS verificadas encontradas para{' '}
                    <strong className="text-[#111111] dark:text-zinc-200">{storeName}</strong> no período {dateFrom} a {dateTo}
                </p>
            )}

            {/* Cards por departamento → subcategorias de serviço → OS */}
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
                    groupedDetailed.map((group) => {
                        const isDeptOpen = expandedDepts.has(group.deptKey);

                        return (
                            <div
                                key={group.deptKey}
                                className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden"
                            >
                                {/* ── Cabeçalho do departamento ── */}
                                <div className="flex items-center bg-gray-100 dark:bg-zinc-800/60">
                                    <button
                                        onClick={() => toggleDept(group.deptKey)}
                                        className="flex-1 flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors text-left"
                                    >
                                        {isDeptOpen
                                            ? <ChevronDown className="h-4 w-4 text-[#666666] dark:text-zinc-400 shrink-0" />
                                            : <ChevronRight className="h-4 w-4 text-[#666666] dark:text-zinc-400 shrink-0" />}
                                        <span className="font-semibold text-[#111111] dark:text-white">{group.label}</span>
                                        <span className="text-xs text-[#666666] dark:text-zinc-400 ml-1">{group.count} OS</span>
                                    </button>
                                    {/* Download do card */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleExportCard(group); }}
                                        disabled={exportingCardKey === group.deptKey}
                                        title={`Exportar ${group.label}`}
                                        className="px-3 py-3 text-[#666666] dark:text-zinc-400 hover:text-[#F5A800] dark:hover:text-[#F5A800] disabled:opacity-40 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <span
                                        className="pr-4 font-bold tabular-nums text-sm"
                                        style={{ color: '#F5A800' }}
                                    >
                                        {formatCurrency(group.total)}
                                    </span>
                                </div>

                                {/* ── Subcategorias de serviço ── */}
                                {isDeptOpen && (
                                    <div className="divide-y divide-[#E8E8E8] dark:divide-[#333333]">
                                        {group.services.map((svcGroup) => {
                                            const svcKey = `${group.deptKey}__${svcGroup.serviceName}`;
                                            const isSvcOpen = expandedServices.has(svcKey);
                                            const showCourtesyCol = group.deptKey !== 'workshop_courtesy';

                                            return (
                                                <div key={svcKey}>
                                                    {/* Linha da subcategoria */}
                                                    <button
                                                        onClick={() => toggleService(svcKey)}
                                                        className="w-full flex items-center gap-2 px-6 py-2.5 bg-gray-50 dark:bg-zinc-800/20 hover:bg-gray-100 dark:hover:bg-zinc-800/40 transition-colors text-left"
                                                    >
                                                        {isSvcOpen
                                                            ? <ChevronDown className="h-3.5 w-3.5 text-[#999999] dark:text-zinc-500 shrink-0" />
                                                            : <ChevronRight className="h-3.5 w-3.5 text-[#999999] dark:text-zinc-500 shrink-0" />}
                                                        <span className="flex-1 text-sm font-medium text-[#333333] dark:text-zinc-300">
                                                            {svcGroup.serviceName}
                                                        </span>
                                                        <span className="text-xs text-[#999999] dark:text-zinc-500 mr-4">
                                                            {svcGroup.count} OS
                                                        </span>
                                                        <span className="text-sm font-semibold tabular-nums text-[#555555] dark:text-zinc-300">
                                                            {formatCurrency(svcGroup.total)}
                                                        </span>
                                                    </button>

                                                    {/* Tabela de OS da subcategoria */}
                                                    {isSvcOpen && (
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="bg-white dark:bg-[#1E1E1E]">
                                                                    <th className="text-left px-8 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Data</th>
                                                                    <th className="text-left px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Placa</th>
                                                                    <th className="text-left px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Nº OS</th>
                                                                    {showCourtesyCol && (
                                                                        <th className="text-left px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Cortesia/Galpão</th>
                                                                    )}
                                                                    <th className="text-right px-4 py-2 font-semibold text-[#666666] dark:text-zinc-400 text-xs uppercase tracking-wide">Valor</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {svcGroup.orders.map((order) => (
                                                                    <tr
                                                                        key={order.id}
                                                                        className="border-t border-[#E8E8E8] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors"
                                                                    >
                                                                        <td className="px-8 py-2 text-[#111111] dark:text-zinc-200 whitespace-nowrap">
                                                                            {formatDateBR(order.service_date ?? order.created_at)}
                                                                        </td>
                                                                        <td className="px-4 py-2 font-mono text-[#111111] dark:text-zinc-200">
                                                                            {order.plate}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-[#111111] dark:text-zinc-200">
                                                                            {order.order_number}
                                                                        </td>
                                                                        {showCourtesyCol && (
                                                                            <td className="px-4 py-2">
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {order.is_courtesy && (
                                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                                                                                            Cortesia
                                                                                        </span>
                                                                                    )}
                                                                                    {order.is_galpon && (
                                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                                                                                            Galpão
                                                                                        </span>
                                                                                    )}
                                                                                    {!order.is_courtesy && !order.is_galpon && (
                                                                                        <span className="text-xs text-[#999999] dark:text-zinc-500">—</span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        )}
                                                                        <td className="px-4 py-2 text-right font-medium tabular-nums text-[#111111] dark:text-zinc-200">
                                                                            {formatCurrency(calcTotal(order))}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
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
