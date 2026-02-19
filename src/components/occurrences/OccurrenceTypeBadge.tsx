import { OccurrenceType, OccurrenceTypeLabels } from '@/types/occurrence.types';
import { OCCURRENCE_TYPE_COLORS } from '@/constants/occurrences';
import { AlertCircle, Clock, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface Props {
    type: OccurrenceType;
    showIcon?: boolean;
    className?: string;
}

// Mapa de ícones por tipo
const TYPE_ICONS = {
    [OccurrenceType.ABSENCE]: XCircle,
    [OccurrenceType.LATE_ARRIVAL]: Clock,
    [OccurrenceType.WARNING]: AlertTriangle,
    [OccurrenceType.SUSPENSION]: AlertCircle,
    [OccurrenceType.OTHER]: HelpCircle
};

export function OccurrenceTypeBadge({
    type,
    showIcon = true,
    className = ''
}: Props) {
    const label = OccurrenceTypeLabels[type];
    const colorClass = OCCURRENCE_TYPE_COLORS[label as keyof typeof OCCURRENCE_TYPE_COLORS] || 'bg-gray-100 text-gray-800 border-gray-300';
    const Icon = TYPE_ICONS[type];

    return (
        <span className={`
            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
            text-xs font-medium border
            ${colorClass} ${className}
        `}>
            {showIcon && Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>
    );
}
