import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentsService } from '@/services/incidents.service';
import type { Incident } from '@/types/incident.types';
import { IncidentStatusBadge } from '@/components/incidents/IncidentStatusBadge';
import { IncidentPriorityBadge } from '@/components/incidents/IncidentPriorityBadge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

import { IncidentTimeline } from '@/components/incidents/IncidentTimeline';

export default function IncidentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadIncident(id);
        }
    }, [id]);

    const loadIncident = async (incidentId: string) => {
        try {
            setLoading(true);
            const data = await incidentsService.getById(incidentId);
            setIncident(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: 'Erro ao carregar detalhes do incidente'
            });
            navigate('/incidents');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    if (!incident) {
        return null;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate('/incidents')} className="mb-4 pl-0 hover:pl-2 transition-all">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Voltar para Lista
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
                            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {incident.incident_number}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>Reportado por {incident.reported_by_user_name || 'Usuário'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(incident.reported_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <IncidentStatusBadge status={incident.status} className="text-sm px-3 py-1" />
                        <IncidentPriorityBadge priority={incident.priority} className="text-sm px-3 py-1" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Descrição</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <IncidentTimeline
                            incidentId={incident.id}
                            currentUserId={user?.id.toString() || ''}
                            userRole={user?.role || 'operator'}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-medium text-gray-900 mb-4">Detalhes</h3>

                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Loja</dt>
                                <dd className="font-medium">{incident.store_name || 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Departamento</dt>
                                <dd className="font-medium">{incident.department || 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Categoria</dt>
                                <dd className="font-medium">{incident.category}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Impacto</dt>
                                <dd className="font-medium capitalize">{incident.impact_level}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
