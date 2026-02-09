import { OccurrenceSeverity, OccurrenceSeverityLabels } from '@/types/occurrence.types';
import { SEVERITY_COLORS } from '@/constants/occurrences';
import { AlertCircle } from 'lucide-react';

interface Props {
    severity: OccurrenceSeverity;
    showIcon?: boolean;
    className?: string;
}

export function OccurrenceSeverityBadge({
    severity,
    showIcon = false,
    className = ''
}: Props) {
    const label = OccurrenceSeverityLabels[severity];
    const colorClass = SEVERITY_COLORS[label] || 'bg-gray-100 text-gray-800 border-gray-300';

    return (
        <span className={`
            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
            text-xs font-medium border
            ${colorClass} ${className}
        `}>
            {showIcon && <AlertCircle className="w-3 h-3" />}
            {label}
        </span>
    );
}
