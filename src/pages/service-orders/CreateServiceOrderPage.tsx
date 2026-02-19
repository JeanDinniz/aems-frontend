import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateServiceOrder } from '@/hooks/useServiceOrders';
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
import type { Department } from '@/types/service-order.types';
import { PhotoUploader } from '@/components/features/service-orders/PhotoUploader';
import { DamageMap } from '@/components/features/service-orders/DamageMap';
import type { Photo } from '@/types/photo.types';
import type { DamagePoint } from '@/types/damage.types';
import { uploadService } from '@/services/api/upload.service';
import { useServices } from '@/hooks/useServices';
import { useConsultants } from '@/hooks/useConsultants';
import { useWorkers } from '@/hooks/useWorkers';
import { useStores } from '@/hooks/useStores';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Store } from '@/services/api/stores.service';

// Enums for Departments
// Enums for Departments
const DEPARTMENTS: { value: Department; label: string }[] = [
    { value: 'film', label: 'Película' },
    { value: 'vn', label: 'VN (Veículos Novos)' },
    { value: 'vu', label: 'VU (Veículos Usados)' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'workshop', label: 'Oficina' },
];

// Zod Schema - Dynamic validation based on store type
// Base schema with common fields
const baseSchema = z.object({
    department: z.enum(['film', 'vn', 'vu', 'bodywork', 'workshop']),
    selected_services: z.array(z.number()).min(1, 'Selecione pelo menos um serviço'),
    location_id: z.coerce.number().positive('Selecione uma loja'),
    plate: z.string().regex(/^[A-Z]{3}\d[A-Z\d]\d{2}$/, 'Placa inválida (Mercosul ou Antiga)'),
    vehicle_model: z.string().min(2, 'Modelo do veículo é obrigatório'),
    vehicle_color: z.string().min(2, 'Cor do veículo é obrigatória'),
    worker_id: z.coerce.number().optional(),
    invoice_number: z.string().optional(),
    notes: z.string().optional(),

    // Fields used for store type detection (will be validated conditionally)
    store_type: z.enum(['dealership', 'direct_sales', 'warehouse']).optional(),
    client_name: z.string().optional(),
    client_phone: z.string().optional(),
    consultant_id: z.coerce.number().optional(),
    dealership_id: z.coerce.number().optional(),
    total_value: z.coerce.number().optional(),
    destination_store_id: z.coerce.number().optional(),
});

const createServiceOrderSchema = baseSchema.superRefine((data, ctx) => {
    const isDealership = data.store_type === 'dealership';
    const isDirectSales = data.store_type === 'direct_sales';
    const isWarehouse = data.store_type === 'warehouse';

    // For warehouse stores
    if (isWarehouse) {
        // Destination store is required
        if (!data.destination_store_id || data.destination_store_id <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Loja de destino é obrigatória para o Galpão',
                path: ['destination_store_id'],
            });
        }
    }

    // For dealership stores
    if (isDealership) {
        // Consultant is required for dealership
        if (!data.consultant_id || data.consultant_id <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Consultor é obrigatório para lojas de concessionária',
                path: ['consultant_id'],
            });
        }

        // Invoice required for film department
        if (data.department === 'film' && !data.invoice_number) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Nota Fiscal é obrigatória para serviços de Película',
                path: ['invoice_number'],
            });
        }
    }

    // For direct_sales stores
    if (isDirectSales) {
        // Client name required
        if (!data.client_name || data.client_name.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Nome do cliente é obrigatório',
                path: ['client_name'],
            });
        }

        // Client phone required
        if (!data.client_phone || !data.client_phone.match(/^\(\d{2}\) \d{4,5}-\d{4}$/)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Telefone é obrigatório (formato: (XX) XXXXX-XXXX)',
                path: ['client_phone'],
            });
        }

        // Total value required
        if (!data.total_value || data.total_value <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Valor total é obrigatório',
                path: ['total_value'],
            });
        }
    }
});

type CreateServiceOrderFormValues = z.infer<typeof createServiceOrderSchema>;

export default function CreateServiceOrderPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const createServiceOrder = useCreateServiceOrder();

    // Custom state for new components
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [damages, setDamages] = useState<DamagePoint[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('film');

    const { data: services, isLoading: isLoadingServices } = useServices(selectedDepartment);
    const { stores, allStores, selectedStoreId } = useStores();

    // Get the selected store details from global context
    const selectedStore = useMemo(() => {
        return allStores?.find((s: Store) => s.id === selectedStoreId);
    }, [allStores, selectedStoreId]);

    // Determine store type
    const storeType = selectedStore?.store_type;
    const isDealership = storeType === 'dealership';
    const isDirectSales = storeType === 'direct_sales';
    const isWarehouse = storeType === 'warehouse';

    // Fetch consultants filtered by store
    const { consultants, isLoading: isLoadingConsultants } = useConsultants(
        selectedStoreId ? { store_id: selectedStoreId, is_active: true } : undefined
    );

    // Fetch workers based on department and store
    const { workers, isLoading: isLoadingWorkers } = useWorkers({
        storeId: selectedDepartment === 'film' ? undefined : selectedStoreId,
        department: selectedDepartment,
        enabled: !!selectedDepartment,
    });

    const form = useForm<CreateServiceOrderFormValues>({
        resolver: zodResolver(createServiceOrderSchema) as any,
        defaultValues: {
            client_name: '',
            client_phone: '',
            vehicle_model: '',
            vehicle_color: '',
            plate: '',
            department: 'film',
            selected_services: [],
            dealership_id: undefined,
            location_id: undefined,
            total_value: undefined,
            invoice_number: '',
            notes: '',
            worker_id: undefined,
            consultant_id: undefined,
            store_type: undefined,
            destination_store_id: undefined,
        },
    });

    // Auto-populate location_id and store_type from global store context
    useEffect(() => {
        if (selectedStore && selectedStoreId) {
            form.setValue('location_id', selectedStoreId);
            form.setValue('store_type', selectedStore.store_type);

            // For dealership stores, auto-populate dealership_id
            if (selectedStore.store_type === 'dealership' && selectedStore.dealership_id) {
                form.setValue('dealership_id', selectedStore.dealership_id);
            } else {
                form.setValue('dealership_id', undefined);
            }

            // Reset dependent fields
            form.setValue('consultant_id', undefined);
            form.setValue('worker_id', undefined);
            form.setValue('destination_store_id', undefined);
        }
    }, [selectedStoreId, selectedStore, form]);

    // Watch for department changes to reset worker
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'department') {
                form.setValue('worker_id', undefined);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    const onSubmit = async (data: CreateServiceOrderFormValues) => {
        // Photos are optional for all store types
        setIsUploading(true);

        try {
            // 1. Upload Photos (if any)
            let photoUrls: string[] = [];
            if (photos.length > 0) {
                const uploadedPhotos = await uploadService.uploadPhotos(photos);
                photoUrls = uploadedPhotos.map((p) => p.url);
            }

            // 2. Prepare Payload (merging form data with photo URLs and damage map)
            const payload: any = {
                department: data.department,
                selected_services: data.selected_services,
                location_id: data.location_id,
                plate: data.plate,
                vehicle_plate: data.plate,
                vehicle_model: data.vehicle_model,
                vehicle_color: data.vehicle_color,
                items: data.selected_services.map(id => ({
                    service_id: id,
                    quantity: 1, // Default quantity
                })),
                notes: data.notes,
                workers: data.worker_id ? [{ user_id: data.worker_id }] : undefined,
            };

            // Add photos if available
            if (photoUrls.length > 0) {
                payload.photos = photoUrls;
            }

            // Add damage map if available
            if (damages.length > 0) {
                payload.damage_map = damages;
            }

            // Add invoice number if provided (required for film in dealership mode)
            if (data.invoice_number) {
                payload.invoice_number = data.invoice_number;
            }

            // Store type specific fields
            if (isDealership) {
                // For dealership: dealership_id is auto-populated from store
                if (selectedStore?.dealership_id) {
                    payload.dealership_id = selectedStore.dealership_id;
                }
                // Consultant is required for dealership
                if (data.consultant_id) {
                    payload.consultant_id = data.consultant_id;
                }
            } else if (isDirectSales) {
                // For direct_sales: include client info and total_value
                payload.client_name = data.client_name;
                payload.client_phone = data.client_phone;
                payload.total_value = data.total_value;
                // No dealership_id for direct sales
                // No consultant for direct sales
            } else if (isWarehouse) {
                // For warehouse: include destination_store_id
                if (data.destination_store_id) {
                    payload.destination_store_id = data.destination_store_id;
                }
                // No consultant for warehouse
                // No dealership_id for warehouse
                // No client info for warehouse
            }

            // Remove temporary fields
            delete payload.worker_id;
            delete payload.selected_services;
            delete payload.store_type;

            // 3. Submit
            createServiceOrder.mutate(payload, {
                onSuccess: () => {
                    toast({
                        title: 'Sucesso',
                        description: 'Ordem de serviço criada com sucesso!',
                    });
                    navigate('/service-orders');
                },
                onError: (error) => {
                    console.error(error);
                    toast({
                        variant: 'destructive',
                        title: 'Erro',
                        description: 'Erro ao criar ordem de serviço. Verifique os dados.',
                    });
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                variant: 'destructive',
                title: 'Erro no Upload',
                description: 'Falha ao enviar as fotos. Tente novamente.',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/service-orders')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">Nova Ordem de Serviço</h1>
                        {selectedStore && (
                            <Badge variant={isWarehouse ? "outline" : isDealership ? "default" : "secondary"} className="text-xs">
                                {isWarehouse ? "Galpão" : isDealership ? "Repasse" : "Venda Direta"}
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Preencha os dados completos para abertura de OS.
                    </p>
                </div>
            </div>

            <div className="border rounded-lg p-6 bg-background shadow-sm">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        {/* SECTION 1: Cliente e Veículo */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">
                                {isWarehouse ? 'Dados do Veículo' : isDirectSales ? 'Dados do Cliente e Veículo' : 'Dados do Veículo'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Client Name - only for direct_sales */}
                                {isDirectSales && (
                                    <FormField
                                        control={form.control as any}
                                        name="client_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Cliente *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: João Silva" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Client Phone - only for direct_sales */}
                                {isDirectSales && (
                                    <FormField
                                        control={form.control as any}
                                        name="client_phone"
                                        render={({ field }) => (
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
                                    control={form.control as any}
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
                                    control={form.control as any}
                                    name="plate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Placa do Veículo *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ABC1D23" className="uppercase" {...field} maxLength={7} />
                                            </FormControl>
                                            <FormDescription>Formato Mercosul (ABC1D23) ou antigo (ABC1234)</FormDescription>
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
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Departamento *</FormLabel>
                                            <Select onValueChange={(value) => {
                                                    field.onChange(value);
                                                    setSelectedDepartment(value);
                                                    form.setValue('selected_services', []);
                                                }} defaultValue={field.value}>
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

                                {/* Total Value - only for direct_sales */}
                                {isDirectSales && (
                                    <FormField
                                        control={form.control as any}
                                        name="total_value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Valor Total (R$) *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="0.00"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <FormField
                                        control={form.control as any}
                                        name="selected_services"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Serviços Realizados *</FormLabel>
                                                <FormControl>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between h-auto min-h-[44px]",
                                                                    !field.value?.length && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value?.length > 0
                                                                    ? `${field.value.length} serviço(s) selecionado(s)`
                                                                    : "Selecione os serviços..."}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[400px] p-0" align="start">
                                                            <div className="p-2 border-b">
                                                                <p className="text-sm font-medium text-muted-foreground">
                                                                    Selecione um ou mais serviços
                                                                </p>
                                                            </div>
                                                            <ScrollArea className="h-[200px]">
                                                                {isLoadingServices ? (
                                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                                        Carregando serviços...
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-1">
                                                                        {services?.map((service) => (
                                                                            <div
                                                                                key={service.id}
                                                                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                                                                onClick={() => {
                                                                                    const current = field.value || [];
                                                                                    const isSelected = current.includes(service.id);
                                                                                    if (isSelected) {
                                                                                        field.onChange(current.filter((id: number) => id !== service.id));
                                                                                    } else {
                                                                                        field.onChange([...current, service.id]);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <div className={cn(
                                                                                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                                    field.value?.includes(service.id)
                                                                                        ? "bg-primary text-primary-foreground"
                                                                                        : "opacity-50 [&_svg]:invisible"
                                                                                )}>
                                                                                    <Check className={cn("h-4 w-4")} />
                                                                                </div>
                                                                                <span className="text-sm">{service.name}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </ScrollArea>
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormControl>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {field.value?.map((serviceId: number) => {
                                                        const service = services?.find(s => s.id === serviceId);
                                                        return service ? (
                                                            <Badge key={serviceId} variant="secondary" className="text-xs">
                                                                {service.name}
                                                            </Badge>
                                                        ) : null;
                                                    })}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: Origem e Responsáveis */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Origem e Responsáveis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="location_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loja *</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    const numValue = Number(value);
                                                    field.onChange(numValue);
                                                    setSelectedStoreId(numValue);
                                                    // Reset consultant and worker when store changes
                                                    form.setValue('consultant_id', undefined);
                                                    form.setValue('worker_id', undefined);
                                                    form.setValue('destination_store_id', undefined);
                                                }}
                                                defaultValue={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a loja" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {stores?.map((store) => (
                                                        <SelectItem key={store.id} value={store.id.toString()}>
                                                            {store.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Destination Store - only for warehouse stores */}
                                {isWarehouse && (
                                    <FormField
                                        control={form.control as any}
                                        name="destination_store_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loja de Destino *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value?.toString()}
                                                    disabled={!selectedStoreId}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={
                                                                !selectedStoreId
                                                                    ? "Selecione o Galpão primeiro"
                                                                    : "Selecione a loja de destino"
                                                            } />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {allStores?.filter((store: Store) =>
                                                            store.store_type !== 'warehouse' && store.id !== selectedStoreId
                                                        ).map((store: Store) => (
                                                            <SelectItem key={store.id} value={store.id.toString()}>
                                                                {store.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>Loja onde o serviço será cobrado</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Consultant - only for dealership stores */}
                                {isDealership && (
                                    <FormField
                                        control={form.control as any}
                                        name="consultant_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Consultor *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value?.toString()}
                                                    disabled={!selectedStoreId}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={
                                                                !selectedStoreId
                                                                    ? "Selecione uma loja primeiro"
                                                                    : "Selecione o consultor"
                                                            } />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {isLoadingConsultants ? (
                                                            <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
                                                        ) : consultants?.length === 0 ? (
                                                            <div className="p-2 text-sm text-muted-foreground">
                                                                Nenhum consultor encontrado
                                                            </div>
                                                        ) : (
                                                            consultants?.map((consultant) => (
                                                                <SelectItem key={consultant.id} value={consultant.id.toString()}>
                                                                    {consultant.name} - {consultant.dealership_name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>Obrigatório para lojas de concessionária</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control as any}
                                    name="worker_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {selectedDepartment === 'film' ? 'Instalador' : 'Funcionário'}
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value?.toString()}
                                                disabled={!selectedDepartment}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={
                                                            !selectedDepartment
                                                                ? "Selecione o departamento primeiro"
                                                                : selectedDepartment === 'film'
                                                                ? "Selecione o instalador"
                                                                : "Selecione o funcionário"
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
                                                                {worker.full_name}
                                                                {selectedDepartment === 'film' && worker.store_name && (
                                                                    <span className="text-muted-foreground text-xs ml-1">
                                                                        ({worker.store_name})
                                                                    </span>
                                                                )}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Opcional - pode ser atribuído depois</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* SECTION 4: Documentação e Vistoria - Show for direct_sales (NOT for warehouse or dealership) */}
                        {isDirectSales && (
                            <div>
                                <h3 className="text-lg font-medium mb-4">Documentação e Vistoria</h3>

                                {/* Invoice - optional for direct_sales, show only if film */}
                                {selectedDepartment === 'film' && (
                                    <div className="mb-6">
                                        <FormField
                                            control={form.control as any}
                                            name="invoice_number"
                                            render={({ field }) => (
                                                <FormItem className="mb-6">
                                                    <FormLabel>Número da Nota Fiscal</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: 123456" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Opcional para venda direta
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Photos - optional for direct_sales */}
                                <div className="mb-8">
                                    <h4 className="text-sm font-medium mb-3">Fotos do Veículo</h4>
                                    <PhotoUploader
                                        photos={photos}
                                        onPhotosChange={setPhotos}
                                        minPhotos={0}
                                        maxPhotos={10}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Opcional - adicione fotos se desejar
                                    </p>
                                </div>

                                {/* Damage Map - optional for direct_sales */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium mb-3">Mapa de Avarias</h4>
                                    <DamageMap
                                        damages={damages}
                                        onDamagesChange={setDamages}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Opcional - marque avarias se houver
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Observações Gerais */}
                        <FormField
                            control={form.control as any}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações Gerais</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Outras informações relevantes..."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => navigate('/service-orders')}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createServiceOrder.isPending || isUploading}>
                                {(createServiceOrder.isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUploading ? 'Enviando Fotos...' : 'Criar Ordem de Serviço'}
                            </Button>
                        </div>

                    </form>
                </Form>
            </div>
        </div>
    );
}

