import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useApprovals } from '@/hooks/useApprovals';
import type { PurchaseRequest } from '@/types/purchase-requests.types';

interface ApprovalDialogProps {
    request: PurchaseRequest;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApprovalDialog({ request, open, onOpenChange }: ApprovalDialogProps) {
    const [approvalType, setApprovalType] = useState<'full' | 'partial'>('full');
    const [selectedItems, setSelectedItems] = useState<number[]>(
        request.items.map((item) => item.id!) // Assuming item.id exists
    );

    const { approve, approvePartial, isApproving } = useApprovals();
    const { register, handleSubmit } = useForm();

    const handleApprove = (data: any) => {
        if (approvalType === 'full') {
            approve(
                { id: request.id, notes: data.notes },
                {
                    onSuccess: () => onOpenChange(false),
                }
            );
        } else {
            approvePartial(
                { id: request.id, itemIds: selectedItems, notes: data.notes },
                {
                    onSuccess: () => onOpenChange(false),
                }
            );
        }
    };

    const selectedTotal = request.items
        .filter((item) => item.id && selectedItems.includes(item.id))
        .reduce((sum, item) => sum + item.quantity * item.estimated_price, 0); // Using estimated_price consistent with type

    const fullTotal = request.items.reduce(
        (sum, item) => sum + item.quantity * item.estimated_price,
        0
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Aprovar Solicitação #{request.id}</DialogTitle>
                </DialogHeader>

                <Tabs value={approvalType} onValueChange={(v) => setApprovalType(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="full">Aprovação Total</TabsTrigger>
                        <TabsTrigger value="partial">Aprovação Parcial</TabsTrigger>
                    </TabsList>

                    <TabsContent value="full" className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800">
                                ✅ Você está aprovando <strong>todos os itens</strong> desta
                                solicitação.
                            </p>
                            <p className="text-lg font-bold text-green-900 mt-2">
                                Valor Total:{' '}
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(fullTotal)}
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="partial" className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800 mb-3">
                                Selecione os itens que deseja aprovar:
                            </p>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {request.items.map((item) => (
                                    <label
                                        key={item.id}
                                        className="flex items-center gap-3 p-2 hover:bg-blue-100 rounded cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={item.id ? selectedItems.includes(item.id) : false}
                                            onCheckedChange={(checked) => {
                                                if (!item.id) return;
                                                if (checked) {
                                                    setSelectedItems([...selectedItems, item.id]);
                                                } else {
                                                    setSelectedItems(
                                                        selectedItems.filter((id) => id !== item.id)
                                                    );
                                                }
                                            }}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{item.product_name}</p>
                                            <p className="text-xs text-gray-600">
                                                {item.quantity} {item.unit} •{' '}
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL',
                                                }).format(item.estimated_price)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold">
                                            {new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            }).format(item.quantity * item.estimated_price)}
                                        </p>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-sm text-blue-800">
                                    Itens selecionados: <strong>{selectedItems.length}</strong> de{' '}
                                    {request.items.length}
                                </p>
                                <p className="text-lg font-bold text-blue-900">
                                    Total:{' '}
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    }).format(selectedTotal)}
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <form onSubmit={handleSubmit(handleApprove)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="notes" className="text-sm font-medium">Observações (opcional)</label>
                        <Textarea
                            id="notes"
                            placeholder="Ex: Aprovado conforme orçamento previsto..."
                            rows={3}
                            {...register('notes')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isApproving || (approvalType === 'partial' && selectedItems.length === 0)}
                        >
                            {isApproving ? 'Aprovando...' : 'Aprovar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
