import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceOrder, useUpdateServiceOrderStatus } from '@/hooks/useServiceOrders';
import { WorkerAssignmentDialog } from '@/components/features/service-orders/WorkerAssignmentDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrafficLightStatus } from '@/components/features/service-orders/TrafficLightStatus';
import { ChevronLeft, User, Car, Tag, MapPin, Loader2, Edit, CheckCircle2, AlertTriangle, Play, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServiceOrderStatus, QualityChecklistItem } from '@/types/service-order.types';
import { QualityChecklistDialog } from '@/components/features/service-orders/QualityChecklistDialog';
import { InvoiceRequiredDialog } from '@/components/features/service-orders/InvoiceRequiredDialog';

const STATUS_LABELS: Record<string, string> = {
    waiting: 'Aguardando',
    doing: 'Fazendo',
    inspection: 'Inspeção',
    ready: 'Pronto',
    delivered: 'Entregue',
};

const DEPARTMENTS: Record<string, string> = {
    film: 'Película',
    bodywork: 'Funilaria',
    aesthetic: 'Estética'
};

export default function ServiceOrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: os, isLoading, isError } = useServiceOrder(Number(id));
    const updateStatus = useUpdateServiceOrderStatus();

    const [showWorkerDialog, setShowWorkerDialog] = useState(false);
    const [showQualityDialog, setShowQualityDialog] = useState(false);
    const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
    const [pendingQualityItems, setPendingQualityItems] = useState<QualityChecklistItem[]>([]);

    const handleWorkerAssignment = (workerIds: number[], primaryWorkerId: number) => {
        updateStatus.mutate({
            id: Number(id),
            status: 'doing',
            extras: {
                worker_ids: workerIds,
                primary_worker_id: primaryWorkerId
            }
        }, {
            onSuccess: () => {
                setShowWorkerDialog(false);
                toast({
                    title: "Serviço Iniciado",
                    description: "Funcionários atribuídos com sucesso."
                });
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível iniciar o serviço."
                });
            }
        });
    };

    const performStatusUpdate = (items: QualityChecklistItem[], invoiceNumber?: string) => {
        updateStatus.mutate({
            id: Number(id),
            status: 'ready',
            extras: {
                quality_checklist: {
                    items,
                    all_passed: true,
                    approved_at: new Date().toISOString()
                },
                ...(invoiceNumber && { invoice_number: invoiceNumber })
            }
        }, {
            onSuccess: () => {
                setShowQualityDialog(false);
                setShowInvoiceDialog(false);
                toast({
                    title: "Inspeção Concluída",
                    description: "Serviço aprovado e marcado como Pronto."
                });
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Falha ao aprovar serviço."
                });
            }
        });
    };

    const handleQualityApprove = (items: QualityChecklistItem[]) => {
        if (os?.department === 'film' && !os.invoice_number) {
            setPendingQualityItems(items);
            setShowInvoiceDialog(true);
            return;
        }
        performStatusUpdate(items);
    };

    const handleInvoiceConfirm = (invoiceNumber: string) => {
        performStatusUpdate(pendingQualityItems, invoiceNumber);
    };

    const handleQualityReject = (notes: string) => {
        updateStatus.mutate({
            id: Number(id),
            status: 'doing',
            extras: {
                quality_checklist: {
                    items: [],
                    all_passed: false,
                    rejection_notes: notes
                }
            }
        }, {
            onSuccess: () => {
                setShowQualityDialog(false);
                toast({
                    variant: "destructive",
                    title: "Serviço Reprovado",
                    description: "O serviço voltou para a fase de execução."
                });
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Falha ao reprovar serviço."
                });
            }
        });
    };

    const handleStatusUpdate = (newStatus: ServiceOrderStatus) => {
        updateStatus.mutate({ id: Number(id), status: newStatus }, {
            onSuccess: () => {
                toast({
                    title: "Status atualizado",
                    description: `O status da OS foi alterado para ${STATUS_LABELS[newStatus]}.`
                });
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível atualizar o status."
                });
            }
        });
    };

    const renderActionButtons = () => {
        if (!os) return null;
        switch (os.status) {
            case 'waiting':
                return (
                    <Button onClick={() => setShowWorkerDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="mr-2 h-4 w-4" /> Iniciar Serviço
                    </Button>
                );
            case 'doing':
                return (
                    <Button onClick={() => handleStatusUpdate('inspection')} className="bg-purple-600 hover:bg-purple-700">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Enviar para Inspeção
                    </Button>
                );
            case 'inspection':
                return (
                    <div className="flex gap-2">
                        <Button onClick={() => handleStatusUpdate('doing')} variant="destructive">
                            <AlertTriangle className="mr-2 h-4 w-4" /> Reprovar
                        </Button>
                        <Button onClick={() => setShowQualityDialog(true)} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar / Pronto
                        </Button>
                    </div>
                );
            case 'ready':
                return (
                    <Button onClick={() => handleStatusUpdate('delivered')} variant="outline">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Entregar Veículo
                    </Button>
                );
            default:
                return null;
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (isError || !os) return <div className="flex justify-center p-8 text-red-500">Erro ao carregar detalhes da OS.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/service-orders')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">OS #{os.order_number}</h1>
                        <Badge variant="outline">
                            {STATUS_LABELS[os.status] || os.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <TrafficLightStatus
                            entryTime={os.entry_time || os.created_at}
                            department={os.department}
                            status={os.status}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/service-orders/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                    {renderActionButtons()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes do Serviço</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Car className="h-3 w-3" /> Veículo / Placa</span>
                                    <p className="text-lg font-medium">{os.client_vehicle}</p>
                                    <div className="inline-block bg-gray-100 px-2 py-0.5 rounded text-sm font-mono border border-gray-300">
                                        {os.plate}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Departamento</span>
                                    <p className="text-lg font-medium">{DEPARTMENTS[os.department] || os.department}</p>
                                    {os.invoice_number && (
                                        <p className="text-sm text-green-600 flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> NF: {os.invoice_number}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Descrição do Serviço</span>
                                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                    {os.service_description}
                                </div>
                            </div>

                            {os.damage_map && (
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground text-orange-600 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Mapa de Avarias
                                    </span>
                                    <div className="p-3 bg-orange-50 border border-orange-100 rounded-md text-sm whitespace-pre-wrap">
                                        {os.damage_map}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Observações Gerais</span>
                                <div className="p-3 bg-muted rounded-md text-sm">
                                    {os.notes || "N/A"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Galeria de Fotos ({os.photos?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!os.photos || os.photos.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Nenhuma foto registrada.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {os.photos.map((url, index) => (
                                        <div key={index} className="relative aspect-video bg-gray-100 rounded-md overflow-hidden border">
                                            <img src={url} alt={`Foto ${index}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {os.workers && os.workers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Equipe Atribuída</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {os.workers.map((worker) => (
                                    <div key={worker.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-medium text-xs">
                                                {worker.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className={worker.isPrimary ? "font-medium" : ""}>
                                                {worker.name} {worker.isPrimary && "(Responsável)"}
                                            </span>
                                        </div>
                                        {worker.isPrimary && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {os.quality_checklist && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Controle de Qualidade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {os.quality_checklist.all_passed ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center text-green-600 gap-2 font-medium">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Aprovado
                                        </div>
                                        {os.quality_checklist.approved_at && (
                                            <p className="text-xs text-muted-foreground">
                                                Em: {new Date(os.quality_checklist.approved_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center text-red-600 gap-2 font-medium">
                                            <AlertTriangle className="h-5 w-5" />
                                            Reprovado
                                        </div>
                                        {os.quality_checklist.rejection_notes && (
                                            <div className="text-sm bg-red-50 p-2 rounded text-red-800">
                                                {os.quality_checklist.rejection_notes}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Cliente / Origem</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{os.client_name}</p>
                                    <p className="text-sm text-muted-foreground">{os.client_phone}</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-muted-foreground">Concessionária</span>
                                    <span className="font-medium">{os.dealership_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-muted-foreground">Consultor</span>
                                    <span className="font-medium">{os.consultant_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-muted-foreground">Local</span>
                                    <span className="font-medium flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {os.location_name || 'Loja 1'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Financeiro</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                                <span className="text-muted-foreground text-sm mb-1">Valor Total</span>
                                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.total_value)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <QualityChecklistDialog
                open={showQualityDialog}
                onOpenChange={setShowQualityDialog}
                orderId={os.id}
                department={os.department}
                onApprove={handleQualityApprove}
                onReject={handleQualityReject}
                isSubmitting={updateStatus.isPending}
            />

            <InvoiceRequiredDialog
                open={showInvoiceDialog}
                onOpenChange={setShowInvoiceDialog}
                onConfirm={handleInvoiceConfirm}
                isSubmitting={updateStatus.isPending}
            />

            <WorkerAssignmentDialog
                open={showWorkerDialog}
                onOpenChange={setShowWorkerDialog}
                storeId={os.location_id}
                onConfirm={handleWorkerAssignment}
                isSubmitting={updateStatus.isPending}
            />
        </div>
    );
}
