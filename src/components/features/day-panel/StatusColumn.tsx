import { ServiceOrderCard } from './ServiceOrderCard';
import type { ServiceOrderCard as IServiceOrderCard, ServiceOrderStatus } from '@/types/day-panel.types';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface StatusColumnProps {
    status: ServiceOrderStatus;
    title: string;
    cards: IServiceOrderCard[];
    colorClass: string;
    accentColor?: string;
    countColor?: string;
}

export function StatusColumn({ status, title, cards, colorClass, accentColor = 'bg-slate-400', countColor = 'text-slate-600' }: StatusColumnProps) {
    const isEmpty = cards.length === 0;

    return (
        <div className="flex flex-col h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className={cn('px-3 py-2.5 border-b flex items-center gap-2.5', colorClass)}>
                {/* Colored accent dot */}
                <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', accentColor)} />

                <h2 className="font-semibold text-sm text-aems-neutral-700 uppercase tracking-wide flex-1">
                    {title}
                </h2>

                {/* Count badge */}
                <span className={cn(
                    'min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold px-1.5',
                    cards.length > 0
                        ? `bg-white/70 dark:bg-black/30 ${countColor}`
                        : 'bg-white/40 dark:bg-black/20 text-aems-neutral-300'
                )}>
                    {cards.length}
                </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 p-2 overflow-y-auto space-y-2 aems-scroll bg-muted/30">
                {cards.map((card, i) => (
                    <div
                        key={card.id}
                        style={{ animationDelay: `${i * 40}ms` }}
                        className="aems-fade-in"
                    >
                        <ServiceOrderCard order={card} />
                    </div>
                ))}

                {isEmpty && (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 text-aems-neutral-300 m-1">
                        <Inbox className="w-8 h-8" strokeWidth={1.5} />
                        <p className="text-xs font-medium">Nenhuma O.S.</p>
                    </div>
                )}
            </div>

            {/* Footer: total count in big number */}
            {!isEmpty && (
                <div className="px-3 py-2 border-t border-border bg-card flex items-center justify-between">
                    <span className="text-[10px] text-aems-neutral-400 font-medium uppercase tracking-wide">
                        {status === 'delivered' ? 'Entregues hoje' : 'Em andamento'}
                    </span>
                    <span className={cn('text-sm font-bold', countColor)}>{cards.length}</span>
                </div>
            )}
        </div>
    );
}
