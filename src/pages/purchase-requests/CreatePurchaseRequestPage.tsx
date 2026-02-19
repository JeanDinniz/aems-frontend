import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCreatePurchaseRequest } from '@/hooks/usePurchaseRequests';
import { useStores } from '@/hooks/useStores';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/types/purchase-requests.types';

const itemSchema = z.object({
    product_name: z.string().min(2, 'Nome muito curto'),
    quantity: z.number().positive('Quantidade inválida'),
    unit: z.string().min(1, 'Unidade obrigatória'),
    estimated_price: z.number().positive('Preço inválido'),
    supplier: z.string().optional(),
    notes: z.string().optional()
});

const formSchema = z.object({
    category: z.enum(['film', 'vn', 'vu', 'workshop', 'equipment', 'uniforms', 'other']),
    urgency: z.enum(['normal', 'urgent', 'critical']),
    items: z.array(itemSchema).min(1, 'Adicione pelo menos 1 item'),
    justification: z.string().min(20, 'Justificativa deve ter pelo menos 20 caracteres')
});

type FormValues = z.infer<typeof formSchema>;

export function CreatePurchaseRequestPage() {
    const navigate = useNavigate();
    const { mutate: createRequest, isPending } = useCreatePurchaseRequest();
    const { selectedStoreId } = useStores();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: 'film',
            urgency: 'normal',
            items: [
                { product_name: '', quantity: 1, unit: 'un', estimated_price: 0 }
            ],
            justification: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    });

    const watchItems = form.watch("items");
    const totalEstimated = watchItems?.reduce((acc, item) => {
        return acc + ((item.quantity || 0) * (item.estimated_price || 0));
    }, 0) || 0;

    function onSubmit(data: FormValues) {
        createRequest({
            ...data,
            store_id: selectedStoreId || undefined
        }, {
            onSuccess: () => {
                navigate('/purchase-requests');
            }
        });
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nova Solicitação de Compra</h1>
                    <p className="text-muted-foreground">Preencha os dados da solicitação para aprovação.</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Gerais</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoria</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="urgency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nível de Urgência</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal (15 dias)</SelectItem>
                                                <SelectItem value="urgent">Urgente (7 dias)</SelectItem>
                                                <SelectItem value="critical">Crítico (Imediato)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="justification"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Justificativa</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Explique a necessidade desta compra..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Itens Solicitados</CardTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ product_name: '', quantity: 1, unit: 'un', estimated_price: 0 })}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Item
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {fields.map((field, index) => (
                                <div key={field.id} className="relative bg-muted/30 p-4 rounded-lg border border-muted">
                                    <div className="absolute right-2 top-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-12 pr-8">
                                        <div className="md:col-span-5">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.product_name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Produto / Serviço</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ex: Bobina Film G5" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Qtd</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0.1"
                                                                step="any"
                                                                {...field}
                                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.unit`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Unidade</FormLabel>
                                                        <FormControl>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <SelectTrigger className="h-10">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="un">Unidade</SelectItem>
                                                                    <SelectItem value="m">Metro</SelectItem>
                                                                    <SelectItem value="m2">m²</SelectItem>
                                                                    <SelectItem value="cx">Caixa</SelectItem>
                                                                    <SelectItem value="lt">Litro</SelectItem>
                                                                    <SelectItem value="kg">Kg</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.estimated_price`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Preço Est. (Unit.)</FormLabel>
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
                                        </div>

                                        <div className="md:col-span-6">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.supplier`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Fornecedor Sugerido (Opcional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ex: 3M Brasil" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="md:col-span-6">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.notes`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Observações (Opcional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Cor, tamanho específico, etc" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <Separator />
                        <div className="p-6 flex justify-end">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-muted-foreground">Total Estimado da Solicitação:</span>
                                <span className="text-2xl font-bold">{formatCurrency(totalEstimated)}</span>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Enviando...' : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Enviar Solicitação
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
