import { useState } from 'react';
import { useDayPanel } from '@/hooks/useDayPanel';
import { StatusColumn } from '@/components/features/day-panel/StatusColumn';
import { DepartmentFilter } from '@/components/features/day-panel/DepartmentFilter';
import { WebSocketIndicator } from '@/components/features/day-panel/WebSocketIndicator';
import { Button } from '@/components/ui/button';
import { Plus, Kanban, AlertTriangle, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { storesService } from '@/services/api/stores.service';

const columnConfig = [
    { status: 'waiting'     as const, title: 'Aguardando', accent: 'bg-slate-500',   header: 'bg-slate-50  border-slate-200  dark:bg-slate-900/40  dark:border-slate-700',  count: 'text-slate-600  dark:text-slate-400'  },
    { status: 'in_progress' as const, title: 'Fazendo',    accent: 'bg-blue-500',    header: 'bg-blue-50   border-blue-200   dark:bg-blue-900/40   dark:border-blue-800',   count: 'text-blue-600   dark:text-blue-400'   },
    { status: 'inspection'  as const, title: 'Inspeção',   accent: 'bg-purple-500',  header: 'bg-purple-50 border-purple-200 dark:bg-purple-900/40 dark:border-purple-800', count: 'text-purple-600 dark:text-purple-400' },
    { status: 'ready'       as const, title: 'Pronto',     accent: 'bg-emerald-500', header: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800', count: 'text-emerald-600 dark:text-emerald-400' },
    { status: 'delivered'   as const, title: 'Entregue',   accent: 'bg-gray-400',    header: 'bg-gray-50   border-gray-200   dark:bg-gray-900/40   dark:border-gray-700',   count: 'text-gray-500   dark:text-gray-400'   },
];

export default function DayPanelPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Supervisor/Owner podem selecionar qual loja visualizar
    const isSupervisorOrOwner = user?.role === 'supervisor' || user?.role === 'owner';
    const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(
        isSupervisorOrOwner ? (user?.store_id ?? undefined) : undefined
    );

    // Busca lista de lojas para o seletor (apenas para Supervisor/Owner)
    const { data: stores = [] } = useQuery({
        queryKey: ['stores-list'],
        queryFn: () => storesService.list(),
        enabled: isSupervisorOrOwner,
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    const {
        columns,
        stats,
        isLoading,
        error,
        filters: { department, setDepartment, onlyDelayed, setOnlyDelayed }
    } = useDayPanel({ storeId: selectedStoreId });

    const totalActive = stats.total - (columns.delivered?.length ?? 0);

    // Erro de permissão ou configuração
    if (error) {
        const errorMsg = (error as any)?.response?.data?.detail || (error as any)?.message || 'Erro ao carregar painel';
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4 text-center px-4">
                <AlertTriangle className="w-12 h-12 text-red-400" />
                <h2 className="text-lg font-semibold text-foreground">Erro ao carregar o painel</h2>
                <p className="text-sm text-muted-foreground max-w-md">{errorMsg}</p>
                {isSupervisorOrOwner && !selectedStoreId && (
                    <p className="text-sm text-amber-600 font-medium">
                        Selecione uma loja no seletor acima para visualizar o painel.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
            {/* ── Top Bar ── */}
            <div className="bg-card border-b border-border px-4 sm:px-6 py-3 shadow-sm space-y-3 flex-shrink-0">
                {/* Row 1: título + stats + botão */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aems-primary-400 to-aems-primary-600 flex items-center justify-center shadow-sm">
                            <Kanban className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-aems-neutral-700 leading-tight">Painel do Dia</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <WebSocketIndicator />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Seletor de loja para Supervisor/Owner */}
                        {isSupervisorOrOwner && stores.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Store className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <select
                                    value={selectedStoreId ?? ''}
                                    onChange={e => setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined)}
                                    className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-aems-primary-400"
                                >
                                    <option value="">Selecione uma loja</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Stats Pills */}
                        <div className="flex items-center gap-2">
                            <StatPill label="Ativas" value={totalActive} color="slate" />
                            {stats.delayed > 0 && (
                                <StatPill label="Atrasadas" value={stats.delayed} color="orange" pulse={false} />
                            )}
                            {stats.critical > 0 && (
                                <StatPill label="Críticas" value={stats.critical} color="red" pulse />
                            )}
                        </div>

                        <Button
                            onClick={() => navigate('/service-orders/new')}
                            className="gap-2 bg-aems-primary-400 hover:bg-aems-primary-500 text-aems-neutral-900 font-semibold shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nova O.S.
                        </Button>
                    </div>
                </div>

                {/* Row 2: aviso de seleção de loja (Supervisor/Owner sem loja selecionada) */}
                {isSupervisorOrOwner && !selectedStoreId && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                        <Store className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Selecione uma loja para visualizar o painel do dia.</span>
                    </div>
                )}

                {/* Row 2 (alternativo): alerta crítico */}
                {stats.critical > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                        <span className="font-medium">{stats.critical} ordem(s) em estado crítico</span>
                        <span className="text-red-500">— requerem atenção imediata.</span>
                    </div>
                )}

                {/* Row 3: filtros de departamento */}
                <div className="flex items-center">
                    <DepartmentFilter
                        currentDepartment={department}
                        onDepartmentChange={setDepartment}
                        showOnlyDelayed={onlyDelayed}
                        onToggleDelayed={setOnlyDelayed}
                    />
                </div>
            </div>

            {/* ── Kanban Board ── */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 pt-4 pb-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div className="w-8 h-8 border-4 border-aems-primary-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium">Carregando painel...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3 h-full min-w-max sm:min-w-0">
                        {columnConfig.map((col) => (
                            <div
                                key={col.status}
                                className="flex-shrink-0 w-72 sm:w-80 lg:flex-1 lg:min-w-[268px] lg:max-w-[340px]"
                            >
                                <StatusColumn
                                    status={col.status}
                                    title={col.title}
                                    cards={columns[col.status] ?? []}
                                    colorClass={col.header}
                                    accentColor={col.accent}
                                    countColor={col.count}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface StatPillProps {
    label: string;
    value: number;
    color: 'slate' | 'orange' | 'red';
    pulse?: boolean;
}

function StatPill({ label, value, color, pulse = false }: StatPillProps) {
    const styles: Record<string, string> = {
        slate:  'bg-slate-100  text-slate-700  border-slate-200',
        orange: 'bg-orange-50  text-orange-700 border-orange-200',
        red:    'bg-red-50     text-red-700    border-red-200',
    };
    return (
        <div className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold',
            styles[color],
            pulse && 'animate-pulse'
        )}>
            <span className="text-base font-bold">{value}</span>
            <span className="font-medium opacity-80">{label}</span>
        </div>
    );
}
