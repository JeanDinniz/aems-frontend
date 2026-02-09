import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOccurrence } from '@/hooks/useOccurrence';
import { useOccurrences } from '@/hooks/useOccurrences';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, CheckCircle2, Calendar, User, MapPin, Clock, FileText, Download } from 'lucide-react';
import { OccurrenceTypeBadge } from '@/components/occurrences/OccurrenceTypeBadge';
import { OccurrenceSeverityBadge } from '@/components/occurrences/OccurrenceSeverityBadge';
import { OccurrenceAcknowledgedBadge } from '@/components/occurrences/OccurrenceAcknowledgedBadge';
import { AcknowledgeOccurrenceDialog } from '@/components/occurrences/AcknowledgeOccurrenceDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OccurrenceDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: occurrence, isLoading } = useOccurrence(Number(id));
    const { acknowledgeOccurrence, isAcknowledging } = useOccurrences();
    const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!occurrence) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-center text-gray-500">Ocorrência não encontrada.</p>
            </div>
        );
    }

    // Funcionário pode reconhecer apenas suas próprias ocorrências
    const canAcknowledge = user?.id === occurrence.employee_id && !occurrence.acknowledged;

    const handleAcknowledge = async (notes?: string) => {
        await acknowledgeOccurrence({
            id: occurrence.id,
            data: { notes }
        });
        setShowAcknowledgeDialog(false);
    };

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/hr/occurrences')}
                    className="mb-4 pl-0 hover:pl-2 transition-all"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Voltar para Lista
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <OccurrenceTypeBadge type={occurrence.occurrence_type} />
                            <OccurrenceSeverityBadge severity={occurrence.severity} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Detalhes da Ocorrência</h1>
                    </div>

                    <OccurrenceAcknowledgedBadge acknowledged={occurrence.acknowledged} className="text-sm px-3 py-1" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="text-lg font-semibold mb-4">Descrição</h2>
                            <p className="text-gray-700 whitespace-pre-wrap">{occurrence.description}</p>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {occurrence.notes && (
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="text-lg font-semibold mb-4">Observações</h2>
                                <p className="text-gray-700 whitespace-pre-wrap">{occurrence.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Anexos */}
                    {occurrence.attachments && occurrence.attachments.length > 0 && (
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-semibold mb-4">Anexos</h3>
                                <div className="space-y-2">
                                    {occurrence.attachments.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            href={attachment.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <FileText className="w-5 h-5 text-gray-400" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {attachment.file_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(attachment.file_size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <Download className="w-4 h-4 text-gray-400" />
                                        </a>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Acknowledge Button */}
                    {canAcknowledge && (
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            Reconhecimento Pendente
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Esta ocorrência requer seu reconhecimento. Ao reconhecer, você confirma
                                            que está ciente do registro.
                                        </p>
                                        <Button
                                            onClick={() => setShowAcknowledgeDialog(true)}
                                            size="sm"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Reconhecer Ocorrência
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-medium text-gray-900 mb-4">Informações</h3>
                            <dl className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <div>
                                        <dt className="text-xs text-gray-500">Data da Ocorrência</dt>
                                        <dd className="font-medium">
                                            {format(new Date(occurrence.occurrence_date), "dd/MM/yyyy", { locale: ptBR })}
                                        </dd>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-4 h-4" />
                                    <div>
                                        <dt className="text-xs text-gray-500">Funcionário</dt>
                                        <dd className="font-medium">ID: {occurrence.employee_id}</dd>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <div>
                                        <dt className="text-xs text-gray-500">Loja</dt>
                                        <dd className="font-medium">Loja {occurrence.store_id}</dd>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <div>
                                        <dt className="text-xs text-gray-500">Registrada em</dt>
                                        <dd className="font-medium">
                                            {format(new Date(occurrence.reported_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </dd>
                                    </div>
                                </div>

                                {occurrence.acknowledged && occurrence.acknowledged_at && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <div>
                                            <dt className="text-xs text-gray-500">Reconhecida em</dt>
                                            <dd className="font-medium">
                                                {format(new Date(occurrence.acknowledged_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </dd>
                                        </div>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Acknowledge Dialog */}
            <AcknowledgeOccurrenceDialog
                open={showAcknowledgeDialog}
                onOpenChange={setShowAcknowledgeDialog}
                onAcknowledge={handleAcknowledge}
                isLoading={isAcknowledging}
            />
        </div>
    );
}
