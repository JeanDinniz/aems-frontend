import { useNavigate } from 'react-router-dom';
import { User, Store, Wrench, AlertTriangle, HardHat } from 'lucide-react';
import type { ServiceOrderCard as IServiceOrderCard, Department, SemaphoreColor } from '@/types/day-panel.types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SemaphoreTimer } from './SemaphoreTimer';

interface ServiceOrderCardProps {
    order: IServiceOrderCard;
}

const departmentBadges: Record<Department, string> = {
    film:      'bg-blue-100     text-blue-700     border-blue-200',
    ppf:       'bg-violet-100   text-violet-700   border-violet-200',
    vn:        'bg-indigo-100   text-indigo-700   border-indigo-200',
    vu:        'bg-cyan-100     text-cyan-700     border-cyan-200',
    bodywork:  'bg-orange-100   text-orange-700   border-orange-200',
    workshop:  'bg-slate-100    text-slate-600    border-slate-200',
};

const departmentLabels: Record<Department, string> = {
    film:     'Película',
    ppf:      'PPF',
    vn:       'VN',
    vu:       'VU',
    bodywork: 'Funilaria',
    workshop: 'Oficina',
};

const semaphoreLeftBorder: Record<SemaphoreColor, string> = {
    white:  'border-l-slate-300',
    yellow: 'border-l-yellow-400',
    orange: 'border-l-orange-500',
    red:    'border-l-red-500',
};

export function ServiceOrderCard({ order }: ServiceOrderCardProps) {
    const navigate = useNavigate();
    const isRed = order.semaphoreColor === 'red';
    const isOrange = order.semaphoreColor === 'orange';

    return (
        <div
            onClick={() => navigate(`/service-orders/${order.id}`)}
            className={cn(
                'bg-card rounded-xl border border-l-4 shadow-sm cursor-pointer',
                'transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
                semaphoreLeftBorder[order.semaphoreColor],
                isRed    && 'ring-1 ring-red-200',
                isOrange && 'ring-1 ring-orange-100',
            )}
        >
            {/* ── Cabeçalho: Placa + Dept ── */}
            <div className="flex items-start justify-between px-3 pt-3 pb-2 gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="font-black text-aems-neutral-700 text-base tracking-widest leading-none">
                            {order.plate}
                        </span>
                    </div>
                    {(order.model || order.color) && (
                        <p className="text-[11px] text-aems-neutral-400 mt-0.5 truncate">
                            {[order.model, order.color].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>

                <Badge
                    variant="outline"
                    className={cn(
                        'text-[10px] px-1.5 py-0.5 border font-semibold flex-shrink-0 pointer-events-none',
                        departmentBadges[order.department]
                    )}
                >
                    {departmentLabels[order.department]}
                </Badge>
            </div>

            {/* ── Semáforo (destaque) ── */}
            <div className="px-3 pb-2">
                <SemaphoreTimer
                    entryTime={order.entryTime}
                    semaphoreColor={order.semaphoreColor}
                    className="w-full justify-center text-sm font-semibold"
                />
            </div>

            {/* ── Serviços ── */}
            <div className="px-3 pb-2">
                <div className="flex items-start gap-1.5 text-xs text-aems-neutral-500">
                    <Wrench className="w-3.5 h-3.5 mt-0.5 text-aems-neutral-300 flex-shrink-0" />
                    <span className="line-clamp-2 leading-relaxed">
                        {order.services.map((s) => s.name).join(' • ')}
                    </span>
                </div>
            </div>

            {/* ── Footer: consultor + loja + instalador ── */}
            <div className="border-t border-aems-neutral-100 px-3 py-2 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-aems-neutral-400">
                    <User className="w-3 h-3 text-aems-neutral-300 flex-shrink-0" />
                    <span className="truncate">{order.consultantName || 'Sem consultor'}</span>
                    <span className="mx-1 text-aems-neutral-200">·</span>
                    <Store className="w-3 h-3 text-aems-neutral-300 flex-shrink-0" />
                    <span className="truncate">{order.storeName}</span>
                </div>

                {order.assignedWorkers && order.assignedWorkers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-aems-neutral-500 font-medium">
                        <HardHat className="w-3 h-3 text-aems-neutral-400 flex-shrink-0" />
                        <span className="truncate">
                            {order.assignedWorkers.map((w) => w.name).join(', ')}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Banner crítico ── */}
            {isRed && (
                <div className="flex items-center justify-center gap-1.5 bg-red-600 text-white text-[10px] font-bold py-1.5 rounded-b-xl">
                    <AlertTriangle className="w-3 h-3" />
                    ATENÇÃO URGENTE
                </div>
            )}
        </div>
    );
}
