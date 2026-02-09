import { useNavigate } from 'react-router-dom';
import type { Occurrence } from '@/types/occurrence.types';
import { OccurrenceTypeBadge } from './OccurrenceTypeBadge';
import { OccurrenceSeverityBadge } from './OccurrenceSeverityBadge';
import { OccurrenceAcknowledgedBadge } from './OccurrenceAcknowledgedBadge';
import { MapPin, Calendar, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
    occurrence: Occurrence;
}

import { memo } from 'react';

// ... imports

export const OccurrenceCard = memo(function OccurrenceCard({ occurrence }: Props) {
    const navigate = useNavigate();

    return (
        <div
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/hr/occurrences/${occurrence.id}`)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <OccurrenceTypeBadge type={occurrence.occurrence_type} />
                    <OccurrenceSeverityBadge severity={occurrence.severity} />
                </div>
                <OccurrenceAcknowledgedBadge acknowledged={occurrence.acknowledged} />
            </div>

            {/* Description Preview */}
            <p className="text-sm text-gray-900 font-medium mb-2 line-clamp-2">
                {occurrence.description}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                        {format(new Date(occurrence.occurrence_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Funcionário ID: {occurrence.employee_id}</span>
                </div>

                <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Loja {occurrence.store_id}</span>
                </div>
            </div>

            {/* Footer - Timestamp */}
            <div className="pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                    Registrada {formatDistanceToNow(new Date(occurrence.reported_at), {
                        addSuffix: true,
                        locale: ptBR
                    })}
                </span>
            </div>
        </div>
    );
});
