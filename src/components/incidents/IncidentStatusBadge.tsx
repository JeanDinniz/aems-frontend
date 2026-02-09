import { IncidentStatus } from '@/types/incident.types';
import { STATUS_COLORS } from '@/constants/incidents';

interface Props {
    status: IncidentStatus;
    className?: string;
}

export function IncidentStatusBadge({ status, className = '' }: Props) {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-300';

    return (
        <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full 
      text-xs font-medium border
      ${colorClass} ${className}
    `}>
            {status}
        </span>
    );
}
