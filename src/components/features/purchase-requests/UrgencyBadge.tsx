import { Badge } from '@/components/ui/badge';
import type { UrgencyLevel } from '@/types/purchase-requests.types';
import { URGENCY_LABELS } from '@/types/purchase-requests.types';
import { cn } from '@/lib/utils';

interface UrgencyBadgeProps {
    urgency: UrgencyLevel;
    className?: string;
}

export function UrgencyBadge({ urgency, className }: UrgencyBadgeProps) {
    const getColorClass = (urgency: UrgencyLevel) => {
        switch (urgency) {
            case 'critical':
                return 'bg-red-500 text-white hover:bg-red-600 border-red-600 animate-pulse'; // Bright red for critical
            case 'urgent':
                return 'bg-orange-500 text-white hover:bg-orange-600 border-orange-600';
            case 'normal':
                return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
            default:
                return '';
        }
    };

    return (
        <Badge
            variant="outline"
            className={cn(getColorClass(urgency), className)}
        >
            {URGENCY_LABELS[urgency]}
        </Badge>
    );
}
