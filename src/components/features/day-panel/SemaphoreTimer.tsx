import { useMemo } from 'react';
import { differenceInMinutes } from 'date-fns';
import { Clock } from 'lucide-react';
import type { SemaphoreColor } from '@/types/day-panel.types';
import { cn } from '@/lib/utils';

interface SemaphoreTimerProps {
    entryTime: string;
    semaphoreColor: SemaphoreColor;
    className?: string;
}

const colorStyles: Record<SemaphoreColor, string> = {
    white: 'text-slate-600 bg-slate-100 border-slate-200',
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    orange: 'text-orange-700 bg-orange-50 border-orange-200',
    red: 'text-red-700 bg-red-50 border-red-200 animate-pulse',
};

export function SemaphoreTimer({ entryTime, semaphoreColor, className }: SemaphoreTimerProps) {
    // We use differenceInMinutes for initial render, 
    // but parent component usually handles the updates or we could have local tick here.
    // Given the parent 'useDayPanel' updates the entire list every second, 
    // receiving the updated 'elapsedMinutes' or just calculating here from 'entryTime' (which is stable) 
    // alongside a key or just relying on parent re-render is fine.
    // Since we want to show "1h 23min", we need a formatter.

    const formattedDuration = useMemo(() => {
        const minutesRef = differenceInMinutes(new Date(), new Date(entryTime));
        const hours = Math.floor(minutesRef / 60);
        const mins = minutesRef % 60;

        if (hours > 0) {
            return `${hours}h ${mins}min`;
        }
        return `${mins}min`;
    }, [entryTime]); // Note: This will only update when entryTime changes or component re-renders. 
    // Since parent re-renders every second, this is recalculated every second.

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md border text-sm font-medium transition-colors",
            colorStyles[semaphoreColor],
            className
        )}>
            <Clock className="w-4 h-4" />
            <span>{formattedDuration}</span>
        </div>
    );
}
