import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFilmBobbin, useUpdateFilmBobbin } from '@/hooks/useFilmBobbins';
import { useStores } from '@/hooks/useStores';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { FILM_TYPES, SUPPLIERS } from '@/types/inventory.types';

const schema = z.object({
    film_type: z.string().min(1, 'Tipo de película obrigatório'),
    nominal_metragem: z.coerce.number().positive('Metragem deve ser positiva'),
    store_id: z.coerce.number().positive(),
    supplier: z.string().optional(),
    batch_number: z.string().optional(),
    purchase_date: z.string().min(1, 'Data de compra obrigatória')
});

type EditFilmBobbinFormValues = z.infer<typeof schema>;

export default function EditFilmBobbinPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const bobbinId = Number(id);

    const { data: bobbin, isLoading } = useFilmBobbin(bobbinId);
    const updateBobbin = useUpdateFilmBobbin();
    const { stores } = useStores();

    const form = useForm<EditFilmBobbinFormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            film_type: '',
            nominal_metragem: 0,
            store_id: 0,
            supplier: '',
            batch_number: '',
            purchase_date: '',
        },
    });

    useEffect(() => {
        if (bobbin) {
            form.reset({
                film_type: bobbin.film_type,
                nominal_metragem: bobbin.nominal_metragem,
                store_id: bobbin.store_id,
                supplier: bobbin.supplier || '',
                batch_number: bobbin.batch_number || '',
                purchase_date: bobbin.purchase_date.split('T')[0],
            });
        }
    }, [bobbin, form]);

    const onSubmit = (data: EditFilmBobbinFormValues) => {
        updateBobbin.mutate({ id: bobbinId, data }, {
            onSuccess: () => {
                toast({
                    title: 'Bobina Atualizada',
                    description: 'As informações foram salvas com sucesso.',
                });
                navigate(`/inventory/${bobbinId}`);
            },
            onError: (error) => {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: 'Erro ao atualizar bobina. Tente novamente.',
                });
            }
        });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!bobbin) {
        return <div className="p-8 text-center text-red-500">Bobina não encontrada.</div>;
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/${bobbinId}`)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Editar Bobina #{bobbin.id}</h1>
                    <p className="text-muted-foreground">
                        Atualizar informações da bobina.
                    </p>
                </div>
            </div>

            <div className="border rounded-lg p-6 bg-background shadow-sm">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-6">
                            <p className="text-sm text-yellow-800">
                                <strong>Atenção:</strong> Alterar a metragem original não afeta consumos passados, mas recalculará o estoque atual.
                            </p>
                        </div>

                        <FormField
                            control={form.control as any}
                            name="film_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Película *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(FILM_TYPES).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control as any}
                                name="nominal_metragem"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Metragem Original (m) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="purchase_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Compra *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control as any}
                                name="supplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fornecedor</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione (Opcional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SUPPLIERS.map((supplier) => (
                                                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="batch_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número do Lote</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Opcional" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control as any}
                            name="store_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loja *</FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(Number(val))}
                                        value={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a loja" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {stores.map((store) => (
                                                <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => navigate(`/inventory/${bobbinId}`)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updateBobbin.isPending}>
                                {updateBobbin.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
