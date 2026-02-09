import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus } from 'lucide-react';
import { useCreateVehicle } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const vehicleSchema = z.object({
    plate: z.string().min(1, 'Placa obrigatória').regex(/^[A-Z]{3}-?\d{1}[A-Z0-9]{1}\d{2}$|^[A-Z]{3}\d{4}$/, 'Placa inválida'),
    brand: z.string().min(1, 'Marca obrigatória'),
    model: z.string().min(1, 'Modelo obrigatório'),
    year: z.coerce.number().optional(),
    color: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface AddVehicleDialogProps {
    clientId: number;
}

export function AddVehicleDialog({ clientId }: AddVehicleDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const createVehicle = useCreateVehicle();

    const form = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleSchema) as any,
        defaultValues: {
            plate: '',
            brand: '',
            model: '',
            year: undefined,
            color: '',
        },
    });

    const onSubmit = (data: VehicleFormValues) => {
        createVehicle.mutate(
            { client_id: clientId, ...data },
            {
                onSuccess: () => {
                    toast({
                        title: 'Veículo adicionado',
                        description: 'Veículo cadastrado com sucesso.',
                    });
                    form.reset();
                    setOpen(false);
                },
                onError: () => {
                    toast({
                        variant: 'destructive',
                        title: 'Erro',
                        description: 'Erro ao cadastrar veículo.',
                    });
                }
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Veículo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Veículo</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control as any}
                            name="plate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Placa</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="ABC-1234"
                                            {...field}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marca</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Honda" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modelo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Civic" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ano</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="2023" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cor</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Prata" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={createVehicle.isPending}>
                            {createVehicle.isPending ? 'Salvando...' : 'Salvar Veículo'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
