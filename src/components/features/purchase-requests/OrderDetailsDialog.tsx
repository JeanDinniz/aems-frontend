import { useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const orderDetailsSchema = z.object({
    supplier_name: z.string().min(1, 'Nome do fornecedor é obrigatório'),
    order_date: z.string().min(1, 'Data do pedido é obrigatória'),
    expected_delivery: z.string().min(1, 'Previsão de entrega é obrigatória'),
    payment_terms: z.string().optional()
});

type OrderDetailsFormValues = z.infer<typeof orderDetailsSchema>;

interface OrderDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (data: OrderDetailsFormValues) => void;
    isPending: boolean;
}

export function OrderDetailsDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending
}: OrderDetailsDialogProps) {
    const form = useForm<OrderDetailsFormValues>({
        resolver: zodResolver(orderDetailsSchema),
        defaultValues: {
            supplier_name: '',
            order_date: new Date().toISOString().split('T')[0], // Hoje
            expected_delivery: '',
            payment_terms: ''
        }
    });

    const onSubmit = (data: OrderDetailsFormValues) => {
        onConfirm(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar Pedido de Compra</DialogTitle>
                    <DialogDescription>
                        Informe os detalhes da compra realizada junto ao fornecedor.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="supplier_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fornecedor</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome da empresa/fornecedor" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="order_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data do Pedido</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expected_delivery"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Previsão de Entrega</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="payment_terms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condições de Pagamento</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="avista">À Vista</SelectItem>
                                            <SelectItem value="boleto_30">Boleto 30 dias</SelectItem>
                                            <SelectItem value="boleto_30_60">Boleto 30/60 dias</SelectItem>
                                            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                            <SelectItem value="pix">PIX</SelectItem>
                                            <SelectItem value="outros">Outros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Salvando...' : 'Confirmar Pedido'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
