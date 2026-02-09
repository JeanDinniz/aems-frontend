import { ServiceOrderCard } from './ServiceOrderCard';
import type { ServiceOrderCard as IServiceOrderCard, ServiceOrderStatus } from '@/types/day-panel.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusColumnProps {
    status: ServiceOrderStatus;
    title: string;
    cards: IServiceOrderCard[];
    colorClass: string;
}

const statusCounts = {
    waiting: 'text-gray-600',
    in_progress: 'text-blue-600',
    inspection: 'text-purple-600',
    ready: 'text-green-600',
    delivered: 'text-slate-600',
};

export function StatusColumn({ status, title, cards, colorClass }: StatusColumnProps) {
    return (
        <div className="flex flex-col h-full min-w-[280px] w-full bg-gray-50/50 rounded-xl border border-gray-100/50 overflow-hidden">
            {/* Header */}
            <div className={cn("p-3 border-b flex justify-between items-center sticky top-0 backdrop-blur-sm z-10", colorClass)}>
                <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-tight">
                    {title}
                </h2>
                <Badge variant="outline" className={cn("bg-white/50 border-0 font-bold", statusCounts[status])}>
                    {cards.length}
                </Badge>
            </div>

            {/* Cards List */}
            <div className="flex-1 p-2 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                {cards.map((card) => (
                    <ServiceOrderCard key={card.id} order={card} />
                ))}

                {cards.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-gray-400 italic border-2 border-dashed border-gray-100 rounded-lg m-1">
                        Nenhuma O.S.
                    </div>
                )}
            </div>
        </div>
    );
}
