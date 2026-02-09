import { useNavigate } from 'react-router-dom';
import type { Incident } from '@/types/incident.types';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { IncidentPriorityBadge } from './IncidentPriorityBadge';
import { MapPin, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
    incident: Incident;
}

export function IncidentCard({ incident }: Props) {
    const navigate = useNavigate();

    const isOverdue = incident.deadline && new Date(incident.deadline) < new Date();

    return (
        <div
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/incidents/${incident.id}`)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <span className="text-sm text-gray-500 font-mono">
                        {incident.incident_number}
                    </span>
                    <h3 className="font-semibold text-gray-900 mt-1">
                        {incident.title}
                    </h3>
                </div>
                <IncidentPriorityBadge priority={incident.priority} />
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {incident.description}
            </p>

            {/* Info */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{incident.store_name || 'Loja não informada'}</span>
                </div>

                {incident.assigned_to_user_name && (
                    <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{incident.assigned_to_user_name}</span>
                    </div>
                )}

                {incident.deadline && (
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        <Clock className="w-4 h-4" />
                        <span>
                            {isOverdue ? '🚨 ' : ''}
                            {formatDistanceToNow(new Date(incident.deadline), {
                                addSuffix: true,
                                locale: ptBR
                            })}
                        </span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <IncidentStatusBadge status={incident.status} />
                <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(incident.created_at), {
                        addSuffix: true,
                        locale: ptBR
                    })}
                </span>
            </div>
        </div>
    );
}
