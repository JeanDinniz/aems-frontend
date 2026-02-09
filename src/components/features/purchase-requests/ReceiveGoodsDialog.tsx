import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PurchaseRequestItem } from '@/types/purchase-requests.types';

const receiveGoodsSchema = z.object({
    invoice_number: z.string().optional(),
    received_by_notes: z.string().optional(),
    items: z.array(z.object({
        item_id: z.number(),
        product_name: z.string(),
        quantity_ordered: z.number(),
        quantity_received: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
        notes: z.string().optional()
    }))
});

type ReceiveGoodsFormValues = z.infer<typeof receiveGoodsSchema>;

interface ReceiveGoodsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: PurchaseRequestItem[];
    onConfirm: (data: any) => void;
    isPending: boolean;
}

export function ReceiveGoodsDialog({
    open,
    onOpenChange,
    items,
    onConfirm,
    isPending
}: ReceiveGoodsDialogProps) {
    const form = useForm<ReceiveGoodsFormValues>({
        resolver: zodResolver(receiveGoodsSchema),
        defaultValues: {
            item_items: [], // Will be reset in useEffect
        }
    });

    // Reset form when items change or dialog opens
    useEffect(() => {
        if (open && items.length > 0) {
            form.reset({
                invoice_number: '',
                received_by_notes: '',
                items: items.map(item => ({
                    item_id: item.id!,
                    product_name: item.product_name,
                    quantity_ordered: item.quantity, // Using requested quantity as default ordered
                    quantity_received: item.quantity, // Default to full receipt
                    notes: ''
                }))
            });
        }
    }, [open, items, form]);

    const { fields } = useFieldArray({
        control: form.control,
        name: 'items'
    });

    const onSubmit = (data: ReceiveGoodsFormValues) => {
        const payload = {
            items: data.items.map(item => ({
                item_id: item.item_id,
                quantity_received: item.quantity_received,
                notes: item.notes
            })),
            invoice_number: data.invoice_number,
            received_by_notes: data.received_by_notes
        };
        onConfirm(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Recebimento de Mercadoria</DialogTitle>
                    <DialogDescription>
                        Confira os itens recebidos e registre as quantidades.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="invoice_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número da Nota Fiscal (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 123456" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-[100px]">Qtd. Pedida</TableHead>
                                        <TableHead className="w-[120px]">Qtd. Recebida</TableHead>
                                        <TableHead className="w-[200px]">Observações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">
                                                {field.product_name}
                                                <input type="hidden" {...form.register(`items.${index}.item_id` as const)} />
                                            </TableCell>
                                            <TableCell>
                                                {field.quantity_ordered}
                                            </TableCell>
                                            <TableCell>
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.quantity_received`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.notes`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Obs. do item" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <FormField
                            control={form.control}
                            name="received_by_notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações Gerais</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observações sobre a entrega (estado da embalagem, transportadora, etc.)"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Salvando...' : 'Confirmar Recebimento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
