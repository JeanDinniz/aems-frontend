import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    X,
    Building2,
    User,
    AlertTriangle,
    Package,
    Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { StatusBadge } from '@/components/features/purchase-requests/StatusBadge';
import { UrgencyBadge } from '@/components/features/purchase-requests/UrgencyBadge';
import { ItemsTable } from '@/components/features/purchase-requests/ItemsTable';
import { ApprovalTimeline } from '@/components/features/purchase-requests/ApprovalTimeline';
import { ReceiveGoodsDialog } from '@/components/features/purchase-requests/ReceiveGoodsDialog';
import { OrderDetailsDialog } from '@/components/features/purchase-requests/OrderDetailsDialog';

import {
    usePurchaseRequest,
    useSupervisorApproval,
    useOwnerApproval,
    useMarkOrdered,
    useReceiveGoods
} from '@/hooks/usePurchaseRequests';
import { CATEGORY_LABELS } from '@/types/purchase-requests.types';
import type { ReceiveGoodsData } from '@/types/purchase-requests.types';

export function PurchaseRequestDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const requestId = Number(id);

    const { data: request, isLoading } = usePurchaseRequest(requestId);
    const { mutate: supervisorApprove, isPending: isSupPending } = useSupervisorApproval();
    const { mutate: ownerApprove, isPending: isOwnerPending } = useOwnerApproval();
    const { mutate: markOrdered, isPending: isOrderPending } = useMarkOrdered();
    const { mutate: receiveGoods, isPending: isReceivePending } = useReceiveGoods();

    const [approvalDialog, setApprovalDialog] = useState<{
        open: boolean;
        type: 'approve' | 'reject';
        role: 'supervisor' | 'owner';
    }>({ open: false, type: 'approve', role: 'supervisor' });

    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);

    if (isLoading) {
        return <div className="p-8 text-center">Carregando detalhes...</div>;
    }

    if (!request) {
        return <div className="p-8 text-center text-red-500">Solicitação não encontrada.</div>;
    }

    const handleAction = () => {
        const action = {
            approved: approvalDialog.type === 'approve',
            notes: approvalDialog.type === 'approve' ? notes : undefined,
            rejection_reason: approvalDialog.type === 'reject' ? rejectionReason : undefined
        };

        const options = {
            onSuccess: () => {
                setApprovalDialog(prev => ({ ...prev, open: false }));
                setNotes('');
                setRejectionReason('');
            }
        };

        if (approvalDialog.role === 'supervisor') {
            supervisorApprove({ id: requestId, action }, options);
        } else {
            ownerApprove({ id: requestId, action }, options);
        }
    };

    const handleOrderConfirm = (data: { supplier_name: string; expected_delivery: string; order_date?: string; payment_terms?: string }) => {
        markOrdered({ id: requestId, data }, { onSuccess: () => setOrderDialogOpen(false) });
    };

    const handleReceiveConfirm = (data: ReceiveGoodsData) => {
        receiveGoods({ id: requestId, data }, { onSuccess: () => setReceiveDialogOpen(false) });
    };

    const canSupervisorAct = request.status === 'awaiting_supervisor';
    const canOwnerAct = request.status === 'awaiting_owner';

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/purchase-requests')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{request.request_number}</h1>
                            <StatusBadge status={request.status} />
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Criado em {new Date(request.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {canSupervisorAct && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => setApprovalDialog({ open: true, type: 'reject', role: 'supervisor' })}
                            >
                                <X className="w-4 h-4 mr-2" /> Rejeitar
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => setApprovalDialog({ open: true, type: 'approve', role: 'supervisor' })}
                            >
                                <Check className="w-4 h-4 mr-2" /> Aprovar (Supervisor)
                            </Button>
                        </>
                    )}

                    {canOwnerAct && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => setApprovalDialog({ open: true, type: 'reject', role: 'owner' })}
                            >
                                <X className="w-4 h-4 mr-2" /> Rejeitar
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => setApprovalDialog({ open: true, type: 'approve', role: 'owner' })}
                            >
                                <Check className="w-4 h-4 mr-2" /> Aprovar (Owner)
                            </Button>
                        </>
                    )}

                    {request.status === 'approved' && (
                        <Button onClick={() => setOrderDialogOpen(true)}>
                            <Truck className="w-4 h-4 mr-2" /> Registrar Pedido de Compra
                        </Button>
                    )}

                    {request.status === 'ordered' && (
                        <Button onClick={() => setReceiveDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                            <Package className="w-4 h-4 mr-2" /> Registrar Recebimento
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes da Solicitação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Solicitante</span>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span>{request.requester_name}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Loja</span>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-muted-foreground" />
                                        <span>{request.store_name}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Categoria</span>
                                    <div>
                                        <Badge variant="secondary">
                                            {CATEGORY_LABELS[request.category]}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Urgência</span>
                                    <div>
                                        <UrgencyBadge urgency={request.urgency} />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Justificativa</span>
                                <p className="text-sm leading-relaxed text-gray-700 bg-muted/20 p-4 rounded-lg">
                                    {request.justification}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Itens ({request.items.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ItemsTable items={request.items} />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status e Aprovações</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ApprovalTimeline request={request} />
                        </CardContent>
                    </Card>

                    {(request.status === 'ordered' || request.status === 'completed') && request.supplier_name && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Dados do Pedido</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fornecedor</span>
                                    <span className="font-medium">{request.supplier_name}</span>
                                </div>
                                {request.expected_delivery && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Previsão Entrega</span>
                                        <span className="font-medium">{new Date(request.expected_delivery).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {request.order_date && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Data do Pedido</span>
                                        <span className="font-medium">{new Date(request.order_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {request.payment_terms && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Cond. Pagamento</span>
                                        <span className="font-medium">{request.payment_terms}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {request.total_estimated > 5000 && (
                        <Card className="bg-amber-50 border-amber-200">
                            <CardContent className="pt-6">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <p className="text-sm text-amber-800">
                                        Esta solicitação excede R$ 5.000,00 e exigirá aprovação adicional da diretoria (Owner) após o supervisor.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Approval/Rejection Dialog */}
            <Dialog open={approvalDialog.open} onOpenChange={(val) => !val && setApprovalDialog(p => ({ ...p, open: false }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {approvalDialog.type === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                        </DialogTitle>
                        <DialogDescription>
                            {approvalDialog.type === 'approve'
                                ? 'Confirme a aprovação desta solicitação. Você pode adicionar observações opcionais.'
                                : 'Por favor, informe o motivo da rejeição. Esta ação não poderá ser desfeita.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {approvalDialog.type === 'approve' ? (
                            <div className="space-y-2">
                                <Label>Observações (Opcional)</Label>
                                <Textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Ex: Aprovado, mas verificar prazo de entrega..."
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-red-500">Motivo da Rejeição (Obrigatório)</Label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    placeholder="Explique o motivo da rejeição..."
                                    className="border-red-200 focus-visible:ring-red-500"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApprovalDialog(p => ({ ...p, open: false }))}>
                            Cancelar
                        </Button>
                        <Button
                            variant={approvalDialog.type === 'approve' ? 'default' : 'destructive'}
                            onClick={handleAction}
                            disabled={isSupPending || isOwnerPending || (approvalDialog.type === 'reject' && !rejectionReason.trim())}
                        >
                            {approvalDialog.type === 'approve' ? 'Confirmar Aprovação' : 'Rejeitar Solicitação'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <OrderDetailsDialog
                open={orderDialogOpen}
                onOpenChange={setOrderDialogOpen}
                onConfirm={handleOrderConfirm}
                isPending={isOrderPending}
            />

            <ReceiveGoodsDialog
                open={receiveDialogOpen}
                onOpenChange={setReceiveDialogOpen}
                items={request.items}
                onConfirm={handleReceiveConfirm}
                isPending={isReceivePending}
            />
        </div>
    );
}
