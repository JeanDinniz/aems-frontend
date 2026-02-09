import { useNavigate } from 'react-router-dom';
import { User, Store, Wrench, AlertTriangle } from 'lucide-react';
import type { ServiceOrderCard as IServiceOrderCard, Department } from '@/types/day-panel.types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SemaphoreTimer } from './SemaphoreTimer';

interface ServiceOrderCardProps {
    order: IServiceOrderCard;
}

const departmentBadges: Record<Department, string> = {
    film: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    esthetics: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    bodywork: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
};

const departmentLabels: Record<Department, string> = {
    film: 'Película',
    esthetics: 'Estética',
    bodywork: 'Funilaria',
};

export function ServiceOrderCard({ order }: ServiceOrderCardProps) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/service-orders/${order.id}`)}
            className={cn(
                "bg-white rounded-lg p-3 shadow-sm border transaction-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02] group",
                order.semaphoreColor === 'red' ? "border-red-200 ring-1 ring-red-100" : "border-gray-200"
            )}
        >
            {/* Header: Placa e Dept */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-gray-900">{order.plate}</h3>
                    <p className="text-xs text-gray-500">{order.model} {order.color && `- ${order.color}`}</p>
                </div>
                <Badge
                    variant="secondary"
                    className={cn("text-[10px] px-1.5 py-0.5 pointer-events-none", departmentBadges[order.department])}
                >
                    {departmentLabels[order.department]}
                </Badge>
            </div>

            {/* Timer */}
            <div className="mb-3">
                <SemaphoreTimer entryTime={order.entryTime} semaphoreColor={order.semaphoreColor} />
            </div>

            {/* Services */}
            <div className="mb-3">
                <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-1">
                    <Wrench className="w-3.5 h-3.5 mt-0.5 text-gray-400" />
                    <div className="line-clamp-2">
                        {order.services.map(s => s.name).join(', ')}
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="text-[11px] text-gray-500 space-y-1 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="truncate max-w-[140px]">
                        {order.consultantName || 'Sem consultor'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <Store className="w-3 h-3 text-gray-400" />
                    <span className="truncate max-w-[140px]">{order.dealershipName}</span>
                </div>

                {order.assignedWorkers && order.assignedWorkers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">
                            {order.assignedWorkers.map(w => w.name).join(', ')}
                        </span>
                    </div>
                )}
            </div>

            {/* Alert if Critical */}
            {order.semaphoreColor === 'red' && (
                <div className="mt-2 flex items-center gap-1.5 text-red-600 text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    ATENÇÃO URGENTE
                </div>
            )}
        </div>
    );
}
