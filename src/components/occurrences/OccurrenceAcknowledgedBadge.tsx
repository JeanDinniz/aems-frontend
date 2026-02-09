import { ACKNOWLEDGED_COLORS } from '@/constants/occurrences';
import { CheckCircle2, Clock } from 'lucide-react';

interface Props {
    acknowledged: boolean;
    showIcon?: boolean;
    className?: string;
}

export function OccurrenceAcknowledgedBadge({
    acknowledged,
    showIcon = true,
    className = ''
}: Props) {
    const label = acknowledged ? 'Reconhecida' : 'Pendente';
    const colorClass = ACKNOWLEDGED_COLORS[acknowledged ? 'true' : 'false'];
    const Icon = acknowledged ? CheckCircle2 : Clock;

    return (
        <span className={`
            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
            text-xs font-medium border
            ${colorClass} ${className}
        `}>
            {showIcon && <Icon className="w-3 h-3" />}
            {label}
        </span>
    );
}
