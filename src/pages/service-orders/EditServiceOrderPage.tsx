import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useServiceOrder, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { useStores } from '@/hooks/useStores';
import { useConsultants } from '@/hooks/useConsultants';
import { useEmployeesByDepartment } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Loader2, Trash2, Upload } from 'lucide-react';
import type { Department } from '@/types/service-order.types';

const DEPARTMENTS: { value: Department; label: string }[] = [
    { value: 'film', label: 'Película' },
    { value: 'ppf', label: 'PPF' },
    { value: 'vn', label: 'VN (Veículos Novos)' },
    { value: 'vu', label: 'VU (Veículos Usados)' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'workshop', label: 'Oficina' },
];

const editServiceOrderSchema = z.object({
    // Vehicle — always required
    vehicle_model: z.string().min(2, 'Modelo do veículo é obrigatório'),
    vehicle_color: z.string().min(2, 'Cor do veículo é obrigatória'),
    plate: z.string().regex(/^[A-Z]{3}\d[A-Z\d]\d{2}$/, 'Placa inválida (Mercosul ou Antiga)'),

    // Service — always required
    department: z.enum(['film', 'vn', 'vu', 'bodywork', 'workshop']),
    service_description: z.string().optional(),

    // Internal identifiers — always present but not exposed as form fields
    location_id: z.number().default(1),
    technician_id: z.coerce.number().optional(),
    consultant_id: z.coerce.number().optional(),

    // Conditional — only for direct_sales (Wash Center)
    client_name: z.string().optional(),
    client_phone: z.string().optional(),
    total_value: z.coerce.number().optional(),
    photos: z.array(z.string()).optional(),
    damage_map: z.string().optional(),

    // Always optional
    external_os_number: z.string().optional(),
    invoice_number: z.string().optional(),
    notes: z.string().optional(),
}).refine(
    (data) => {
        if (data.department === 'film' && !data.invoice_number) {
            return false;
        }
        return true;
    },
    {
        message: 'Nota Fiscal é obrigatória para serviços de Película',
        path: ['invoice_number'],
    }
);

type EditServiceOrderFormValues = z.infer<typeof editServiceOrderSchema>;

export default function EditServiceOrderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: os, isLoading: isLoadingOS } = useServiceOrder(Number(id));
    const updateServiceOrder = useUpdateServiceOrder();
    const { allStores, selectedStoreId } = useStores();

    // Determine store type from the OS's location_id
    const osStore = useMemo(() => {
        if (!os || !allStores?.length) return null;
        return allStores.find((s) => s.id === os.location_id) ?? null;
    }, [os, allStores]);

    const isDirectSales = osStore?.store_type === 'direct_sales';
    const isDealership = osStore?.store_type === 'dealership';

    const form = useForm<EditServiceOrderFormValues>({
        resolver: zodResolver(editServiceOrderSchema) as any,
        defaultValues: {
            client_name: '',
            client_phone: '',
            vehicle_model: '',
            vehicle_color: '',
            plate: '',
            department: 'film',
            location_id: 1,
            total_value: undefined,
            photos: [],
            damage_map: '',
            invoice_number: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (os) {
            form.reset({
                client_name: os.client_name ?? '',
                client_phone: os.client_phone ?? '',
                vehicle_model: os.vehicle_model ?? '',
                vehicle_color: os.vehicle_color ?? '',
                plate: os.plate ?? 'ABC1234',
                department: os.department ?? 'film',
                location_id: os.location_id,
                total_value: os.total_value,
                photos: os.photos ?? [],
                damage_map: os.damage_map ?? '',
                external_os_number: os.external_os_number ?? '',
                invoice_number: os.invoice_number ?? '',
                notes: os.notes ?? '',
                technician_id: os.technician_id ?? undefined,
                consultant_id: os.consultant_id ?? undefined,
            });
        }
    }, [os, form]);

    const onSubmit = (data: EditServiceOrderFormValues) => {
        // Strip direct_sales-only fields when the store is not direct_sales
        const payload: any = { ...data };
        if (!isDirectSales) {
            delete payload.client_name;
            delete payload.client_phone;
            delete payload.total_value;
            delete payload.photos;
            delete payload.damage_map;
        }

        updateServiceOrder.mutate(
            { id: Number(id), data: payload },
            {
                onSuccess: () => {
                    toast({
                        title: 'Sucesso',
                        description: 'Ordem de serviço atualizada com sucesso!',
                    });
                    navigate(`/service-orders/${id}`);
                },
                onError: (error) => {
                    console.error(error);
                    toast({
                        variant: 'destructive',
                        title: 'Erro',
                        description: 'Erro ao atualizar ordem de serviço.',
                    });
                },
            }
        );
    };

    const selectedDepartment = form.watch('department') ?? 'film';

    // storeId: uses the OS's store once loaded, falls back to the globally selected store
    const storeId = os?.location_id || selectedStoreId;

    // Fetch consultants filtered by the store
    const { consultants, isLoading: isLoadingConsultants } = useConsultants(
        storeId ? { store_id: storeId, is_active: true } : undefined
    );

    // Fetch employees filtered by store and department
    const { data: workers, isLoading: isLoadingWorkers } = useEmployeesByDepartment(
        storeId,
        selectedDepartment,
    );

    if (isLoadingOS) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/service-orders/${id}`)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Editar Ordem de Serviço</h1>
                    <p className="text-muted-foreground">
                        Edição de dados e correção.
                    </p>
                </div>
            </div>

            <div className="border rounded-lg p-6 bg-background shadow-sm">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        {/* SECTION 1: Dados do Cliente e Veículo */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">
                                {isDirectSales ? 'Dados do Cliente e Veículo' : 'Dados do Veículo'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Client Name — only for direct_sales */}
                                {isDirectSales && (
                                    <FormField
                                        control={form.control as any}
                                        name="client_name"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Cliente *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Client Phone — only for direct_sales */}
                                {isDirectSales && (
                                    <FormField
                                        control={form.control as any}
                                        name="client_phone"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Telefone *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control as any}
                                    name="vehicle_model"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Modelo do Veículo *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Honda Civic" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="vehicle_color"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Cor do Veículo *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Preto" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="plate"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Placa *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="ABC1D23"
                                                    className="uppercase"
                                                    {...field}
                                                    maxLength={7}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* SECTION 2: Detalhes do Serviço */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Detalhes do Serviço</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="department"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Departamento *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o departamento" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {DEPARTMENTS.map((dept) => (
                                                        <SelectItem key={dept.value} value={dept.value}>
                                                            {dept.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Total Value — only for direct_sales */}
                                {isDirectSales && (
                                    <FormField
                                        control={form.control as any}
                                        name="total_value"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Valor Total (R$) *</FormLabel>
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
                                )}

                            </div>
                        </div>

                        {/* SECTION 3: Responsáveis */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Responsáveis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* External OS Number — only for dealership */}
                                {isDealership && (
                                    <FormField
                                        control={form.control as any}
                                        name="external_os_number"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Nº OS da Concessionária</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ex: 12345"
                                                        {...field}
                                                    />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control as any}
                                    name="consultant_id"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Consultor{isDealership ? ' *' : ''}</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value?.toString()}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione (Opcional)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoadingConsultants ? (
                                                        <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
                                                    ) : consultants?.length === 0 ? (
                                                        <div className="p-2 text-sm text-muted-foreground">Nenhum consultor encontrado</div>
                                                    ) : (
                                                        consultants?.map((consultant) => (
                                                            <SelectItem key={consultant.id} value={consultant.id.toString()}>
                                                                {consultant.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="technician_id"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {selectedDepartment === 'film' ? 'Instalador' : 'Funcionário'}
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value?.toString()}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={
                                                            selectedDepartment === 'film'
                                                                ? 'Selecione o instalador'
                                                                : 'Selecione o funcionário'
                                                        } />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoadingWorkers ? (
                                                        <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
                                                    ) : workers?.length === 0 ? (
                                                        <div className="p-2 text-sm text-muted-foreground">
                                                            Nenhum {selectedDepartment === 'film' ? 'instalador' : 'funcionário'} encontrado
                                                        </div>
                                                    ) : (
                                                        workers?.map((worker) => (
                                                            <SelectItem key={worker.id} value={worker.id.toString()}>
                                                                {worker.name}
                                                                {worker.store_name && (
                                                                    <span className="text-muted-foreground text-xs ml-1">
                                                                        ({worker.store_name})
                                                                    </span>
                                                                )}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Opcional - pode ser alterado depois</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* SECTION 4: Documentação */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Documentação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedDepartment === 'film' && (
                                    <FormField
                                        control={form.control as any}
                                        name="invoice_number"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Número da Nota Fiscal *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormDescription className="text-amber-600">
                                                    Obrigatório para departamento de Película.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Damage Map — only for direct_sales */}
                                {isDirectSales && (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormField
                                            control={form.control as any}
                                            name="damage_map"
                                            render={({ field }: { field: any }) => (
                                                <FormItem>
                                                    <FormLabel>Mapa de Avarias</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            className="min-h-[80px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </FormItem>
                                )}
                            </div>

                            {/* Photos — only for direct_sales */}
                            {isDirectSales && (
                                <FormField
                                    control={form.control as any}
                                    name="photos"
                                    render={({ field }) => (
                                        <FormItem className="mt-6">
                                            <FormLabel>Fotos do Veículo</FormLabel>
                                            <FormControl>
                                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {field.value?.map((photo: string, index: number) => (
                                                        <div key={index} className="relative aspect-video bg-muted rounded-md overflow-hidden border">
                                                            <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute top-1 right-1 h-6 w-6"
                                                                onClick={() => {
                                                                    const newPhotos = [...(field.value ?? [])];
                                                                    newPhotos.splice(index, 1);
                                                                    field.onChange(newPhotos);
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="aspect-video h-auto flex flex-col gap-2 border-dashed"
                                                        onClick={() => {
                                                            const mockUrl = `https://placehold.co/600x400?text=Photo+${(field.value?.length || 0) + 1}`;
                                                            field.onChange([...(field.value || []), mockUrl]);
                                                        }}
                                                    >
                                                        <Upload className="h-6 w-6" />
                                                        <span>Adicionar Foto</span>
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control as any}
                            name="notes"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => navigate(`/service-orders/${id}`)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updateServiceOrder.isPending}>
                                {updateServiceOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </div>

                    </form>
                </Form>
            </div>
        </div>
    );
}
