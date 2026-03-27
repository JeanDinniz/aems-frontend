import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
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
import { ChevronLeft, Loader2 } from 'lucide-react';
import { DEPARTMENTS } from '@/constants/service-orders';
import type { CreateServiceOrderData } from '@/types/service-order.types';
import { logger } from '@/lib/logger';

const editServiceOrderSchema = z.object({
    // Vehicle — always required
    vehicle_model: z.string().min(2, 'Modelo do veículo é obrigatório'),
    vehicle_color: z.string().min(2, 'Cor do veículo é obrigatória'),
    plate: z.string().regex(/^[A-Z]{3}\d[A-Z\d]\d{2}$/, 'Placa inválida (Mercosul ou Antiga)'),

    // Service — always required
    department: z.enum(['film', 'ppf', 'vn', 'vu', 'bodywork', 'workshop']),
    service_description: z.string().optional(),

    // Internal identifiers — always present but not exposed as form fields
    location_id: z.number().default(1),
    technician_id: z.coerce.number().optional(),
    consultant_id: z.coerce.number().optional(),

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

type EditServiceOrderFormValues = z.input<typeof editServiceOrderSchema>;

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

    const isDealership = osStore?.store_type === 'dealership';

    const form = useForm<EditServiceOrderFormValues>({
        // @hookform/resolvers v5 + zod v4 have a type incompatibility in the Resolver generic.
        // Casting through unknown to the correct Resolver type preserves full form type safety.
        resolver: zodResolver(editServiceOrderSchema) as unknown as Resolver<EditServiceOrderFormValues>,
        defaultValues: {
            vehicle_model: '',
            vehicle_color: '',
            plate: '',
            department: 'film',
            location_id: 1,
            invoice_number: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (os) {
            form.reset({
                vehicle_model: os.vehicle_model ?? '',
                vehicle_color: os.vehicle_color ?? '',
                plate: os.plate ?? 'ABC1234',
                department: os.department ?? 'film',
                location_id: os.location_id,
                external_os_number: os.external_os_number ?? '',
                invoice_number: os.invoice_number ?? '',
                notes: os.notes ?? '',
                technician_id: os.technician_id ?? undefined,
                consultant_id: os.consultant_id ?? undefined,
            });
        }
    }, [os, form]);

    const onSubmit = (data: EditServiceOrderFormValues) => {
        const payload = { ...data } as Record<string, unknown>;

        updateServiceOrder.mutate(
            { id: Number(id), data: payload as Partial<CreateServiceOrderData> },
            {
                onSuccess: () => {
                    toast({
                        title: 'Sucesso',
                        description: 'Ordem de serviço atualizada com sucesso!',
                    });
                    navigate(`/service-orders/${id}`);
                },
                onError: (error) => {
                    logger.error(error);
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
    const storeId = os?.location_id || selectedStoreId || undefined;

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

                        {/* SECTION 1: Dados do Veículo */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Dados do Veículo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="vehicle_model"
                                    render={({ field }) => (
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
                                    control={form.control}
                                    name="vehicle_color"
                                    render={({ field }) => (
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
                                    control={form.control}
                                    name="plate"
                                    render={({ field }) => (
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
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
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

                            </div>
                        </div>

                        {/* SECTION 3: Responsáveis */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Responsáveis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* External OS Number — only for dealership */}
                                {isDealership && (
                                    <FormField
                                        control={form.control}
                                        name="external_os_number"
                                        render={({ field }) => (
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
                                    control={form.control}
                                    name="consultant_id"
                                    render={({ field }) => (
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
                                    control={form.control}
                                    name="technician_id"
                                    render={({ field }) => (
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
                                        control={form.control}
                                        name="invoice_number"
                                        render={({ field }) => (
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

                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
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
