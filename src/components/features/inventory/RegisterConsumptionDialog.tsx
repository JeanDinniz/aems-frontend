import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegisterConsumption } from '@/hooks/useFilmBobbins';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface RegisterConsumptionDialogProps {
    bobbinId: number;
    currentMetragem: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const consumptionSchema = z.object({
    service_order_id: z.coerce.number().positive('ID da OS obrigatório'),
    metragem_used: z.coerce.number().positive('Metragem deve ser positiva'),
    notes: z.string().optional(),
});

type ConsumptionFormValues = z.infer<typeof consumptionSchema>;

export function RegisterConsumptionDialog({
    bobbinId,
    currentMetragem,
    open,
    onOpenChange
}: RegisterConsumptionDialogProps) {
    const { toast } = useToast();
    const registerConsumption = useRegisterConsumption();

    const form = useForm<ConsumptionFormValues>({
        resolver: zodResolver(consumptionSchema) as any,
        defaultValues: {
            service_order_id: undefined,
            metragem_used: undefined,
            notes: '',
        },
    });

    const onSubmit = (data: ConsumptionFormValues) => {
        if (data.metragem_used > currentMetragem) {
            form.setError('metragem_used', {
                type: 'manual',
                message: `Metragem excede o disponível (${currentMetragem}m)`
            });
            return;
        }

        registerConsumption.mutate(
            { id: bobbinId, consumption: { ...data, bobbin_id: bobbinId } },
            {
                onSuccess: () => {
                    toast({
                        title: 'Consumo registrado',
                        description: 'O estoque foi atualizado com sucesso.',
                    });
                    form.reset();
                    onOpenChange(false);
                },
                onError: (error) => {
                    console.error(error);
                    toast({
                        variant: 'destructive',
                        title: 'Erro',
                        description: 'Erro ao registrar consumo.',
                    });
                }
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Consumo</DialogTitle>
                    <DialogDescription>
                        Informe a OS e a metragem utilizada desta bobina.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control as any}
                            name="service_order_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ID da Ordem de Serviço</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 1234" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="metragem_used"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Metragem Utilizada (m)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Ex: 2.50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <p className="text-xs text-muted-foreground">
                                        Disponível: {currentMetragem}m
                                    </p>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Opcional..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={registerConsumption.isPending}>
                                {registerConsumption.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Confirmar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
