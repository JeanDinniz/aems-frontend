import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Package, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ApprovalDialog } from './ApprovalDialog';
import { RejectionDialog } from './RejectionDialog';
import { UrgencyBadge } from '@/components/features/purchase-requests/UrgencyBadge';
import { CATEGORY_LABELS } from '@/types/purchase-requests.types';
import type { PurchaseRequest } from '@/types/purchase-requests.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ApprovalCardProps {
    request: PurchaseRequest;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
}

export function ApprovalCard({ request, isSelected, onSelect }: ApprovalCardProps) {
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

    const totalValue = request.items.reduce(
        (sum, item) => sum + item.quantity * item.estimated_price,
        0
    );

    const timeAgo = formatDistanceToNow(new Date(request.created_at), {
        locale: ptBR,
        addSuffix: true,
    });

    return (
        <>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => onSelect(checked as boolean)}
                                className="mt-1"
                            />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">#{request.request_number}</h3>
                                    <Badge variant="outline">{CATEGORY_LABELS[request.category]}</Badge>
                                    <UrgencyBadge urgency={request.urgency} />
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>{request.requester_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Package className="h-4 w-4" />
                                        <span>{request.store_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{timeAgo}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(totalValue)}
                            </p>
                            <p className="text-sm text-gray-500">{request.items.length} itens</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Justificativa */}
                    {request.justification && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{request.justification}</p>
                        </div>
                    )}

                    {/* Itens (resumo) */}
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Itens:</p>
                        {request.items.slice(0, 3).map((item) => (
                            <p key={item.id} className="text-sm text-gray-600">
                                • {item.quantity}x {item.product_name}
                            </p>
                        ))}
                        {request.items.length > 3 && (
                            <p className="text-sm text-gray-500">
                                + {request.items.length - 3} itens
                            </p>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2 border-t">
                        <Button
                            variant="outline"
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={() => setRejectionDialogOpen(true)}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                        </Button>
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => setApprovalDialogOpen(true)}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <ApprovalDialog
                request={request}
                open={approvalDialogOpen}
                onOpenChange={setApprovalDialogOpen}
            />
            <RejectionDialog
                request={request}
                open={rejectionDialogOpen}
                onOpenChange={setRejectionDialogOpen}
            />
        </>
    );
}
