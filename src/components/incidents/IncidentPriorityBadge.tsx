import { IncidentPriority } from '@/types/incident.types';
import { PRIORITY_COLORS } from '@/constants/incidents';
import { Flag, AlertTriangle } from 'lucide-react';

interface Props {
    priority: IncidentPriority;
    showIcon?: boolean;
    className?: string;
}

export function IncidentPriorityBadge({
    priority,
    showIcon = true,
    className = ''
}: Props) {
    const colorClass = PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
    const Icon = priority === IncidentPriority.URGENT ? AlertTriangle : Flag;

    return (
        <span className={`
      inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full 
      text-xs font-medium border
      ${colorClass} ${className}
    `}>
            {showIcon && <Icon className="w-3 h-3" />}
            {priority}
        </span>
    );
}
