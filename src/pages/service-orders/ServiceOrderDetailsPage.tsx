import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceOrder, useUpdateServiceOrder, useUpdateServiceOrderStatus, useCancelServiceOrder } from '@/hooks/useServiceOrders';
import { useAuth } from '@/hooks/useAuth';
import { WorkerAssignmentDialog } from '@/components/features/service-orders/WorkerAssignmentDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrafficLightStatus } from '@/components/features/service-orders/TrafficLightStatus';
import { ChevronLeft, Car, Tag, Loader2, Edit, CheckCircle2, AlertTriangle, Play, FileText, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServiceOrderStatus, QualityChecklistItem, CreateServiceOrderData } from '@/types/service-order.types';
import { QualityChecklistDialog } from '@/components/features/service-orders/QualityChecklistDialog';
import { InvoiceRequiredDialog } from '@/components/features/service-orders/InvoiceRequiredDialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { STATUS_LABELS, DEPARTMENTS_MAP } from '@/constants/service-orders';

export default function ServiceOrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: os, isLoading, isError } = useServiceOrder(Number(id));
    const updateStatus = useUpdateServiceOrderStatus();
    const updateOrder = useUpdateServiceOrder();

    const { user } = useAuth();
    const cancelOrder = useCancelServiceOrder();

    const [showWorkerDialog, setShowWorkerDialog] = useState(false);
    const [showQualityDialog, setShowQualityDialog] = useState(false);
    const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [pendingQualityItems, setPendingQualityItems] = useState<QualityChecklistItem[]>([]);

    const canCancel = (user?.role === 'owner' || user?.role === 'supervisor')
        && os?.status !== 'cancelled';

    const handleWorkerAssignment = (workerIds: number[], primaryWorkerId: number) => {
        // 1. Save selected employees to the OS
        const workers = [
            { employee_id: primaryWorkerId },
            ...workerIds
                .filter(id => id !== primaryWorkerId)
                .map(id => ({ employee_id: id })),
        ];

        updateOrder.mutate({ id: Number(id), data: { workers } as Partial<CreateServiceOrderData> }, {
            onSuccess: () => {
                // 2. Change status to 'doing'
                updateStatus.mutate({ id: Number(id), status: 'doing' }, {
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
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível atribuir os funcionários."
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
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">OS #{os.order_number}</h1>
                            <Badge
                                variant={os.status === 'cancelled' ? 'destructive' : 'outline'}
                            >
                                {STATUS_LABELS[os.status] || os.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrafficLightStatus
                                entryTime={os.entry_time || os.created_at}
                                department={os.department}
                                status={os.status}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {os.status !== 'cancelled' && (
                                <Button variant="outline" onClick={() => navigate(`/service-orders/${id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </Button>
                            )}
                            {renderActionButtons()}
                            {canCancel && (
                                <Button
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setShowCancelDialog(true)}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancelar OS
                                </Button>
                            )}
                        </div>
                    </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Car className="h-3 w-3" /> Veículo / Placa</span>
                                    <p className="text-lg font-medium">{os.vehicle_model}{os.vehicle_color ? ` - ${os.vehicle_color}` : ''}</p>
                                    <div className="inline-block bg-gray-100 px-2 py-0.5 rounded text-sm font-mono border border-gray-300">
                                        {os.plate}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Departamento</span>
                                    <p className="text-lg font-medium">{DEPARTMENTS_MAP[os.department] || os.department}</p>
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

                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Observações Gerais</span>
                                <div className="p-3 bg-muted rounded-md text-sm">
                                    {os.notes || "N/A"}
                                </div>
                            </div>
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

            {/* Dialog: Confirmar Cancelamento */}
            <Dialog
                open={showCancelDialog}
                onOpenChange={(open) => {
                    setShowCancelDialog(open);
                    if (!open) setCancelReason('');
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Cancelar Ordem de Serviço
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        A OS <strong>#{os.order_number}</strong> será cancelada e removida do painel
                        operacional. O registro ficará disponível para auditoria.
                    </p>
                    <div className="space-y-1.5">
                        <label htmlFor="cancel-reason" className="text-sm font-medium">Motivo (opcional)</label>
                        <Textarea
                            id="cancel-reason"
                            placeholder="Ex: OS lançada por engano, veículo não compareceu..."
                            className="min-h-[80px]"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCancelDialog(false);
                                setCancelReason('');
                            }}
                        >
                            Voltar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                cancelOrder.mutate(
                                    { id: Number(id), reason: cancelReason || undefined },
                                    {
                                        onSuccess: () => {
                                            setShowCancelDialog(false);
                                            setCancelReason('');
                                            toast({
                                                title: 'OS Cancelada',
                                                description: 'A ordem de serviço foi cancelada.',
                                            });
                                        },
                                        onError: () => {
                                            toast({
                                                variant: 'destructive',
                                                title: 'Erro',
                                                description: 'Não foi possível cancelar a OS.',
                                            });
                                        },
                                    }
                                );
                            }}
                            disabled={cancelOrder.isPending}
                        >
                            {cancelOrder.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirmar Cancelamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
