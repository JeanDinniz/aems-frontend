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
import { ChevronLeft, ChevronRight, Loader2, Car, Wrench, Users, ClipboardCheck } from 'lucide-react';
import type { Department } from '@/types/service-order.types';
import { PhotoUploader } from '@/components/features/service-orders/PhotoUploader';
import { DamageMap } from '@/components/features/service-orders/DamageMap';
import type { Photo } from '@/types/photo.types';
import type { DamagePoint } from '@/types/damage.types';
import { uploadService } from '@/services/api/upload.service';
import { useServices } from '@/hooks/useServices';
import { useConsultants } from '@/hooks/useConsultants';
import { useStores } from '@/hooks/useStores';
import { Stepper } from '@/components/ui/stepper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Store } from '@/services/api/stores.service';

const FILM_DEPARTMENTS = ['film', 'ppf'];

const CATEGORY_LABELS: Record<string, string> = {
    lavagem: 'Lavagem',
    polimento: 'Polimento',
    polimento_peca: 'Polimento/Peça',
    higienizacao: 'Higienização',
    hidratacao: 'Hidratação',
    enceramento: 'Enceramento',
    vitrificacao: 'Vitrificação',
    cristalizacao: 'Cristalização',
    pacote_estetica: 'Pacotes',
    estetica: 'Estética',
    martelinho: 'Martelinho',
    pelicula_tintada: 'Fumê',
    pelicula_poliester: 'Poliéster',
    pelicula_premium: 'Premium',
    pelicula_seguranca: 'Segurança',
    pelicula_3m: '3M',
    ppf_avulso: 'PPF Avulso',
    ppf_pacote: 'PPF Pacotes',
    vn: 'VN',
    vu: 'VU',
};

const DEPARTMENTS: { value: Department; label: string }[] = [
    { value: 'film',     label: 'Película' },
    { value: 'ppf',      label: 'PPF' },
    { value: 'vn',       label: 'VN (Veículos Novos)' },
    { value: 'vu',       label: 'VU (Veículos Usados)' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'workshop', label: 'Oficina' },
];

const baseSchema = z.object({
    department: z.enum(['film', 'ppf', 'vn', 'vu', 'bodywork', 'workshop']),
    selected_services: z.array(z.number()).min(1, 'Selecione pelo menos um serviço'),
    location_id: z.coerce.number().positive('Selecione uma loja'),
    plate: z.string().regex(/^[A-Z]{3}\d[A-Z\d]\d{2}$/, 'Placa inválida (Mercosul ou Antiga)'),
    vehicle_model: z.string().min(2, 'Modelo do veículo é obrigatório'),
    vehicle_color: z.string().min(2, 'Cor do veículo é obrigatória'),
    external_os_number: z.string().optional(),
    invoice_number: z.string().optional(),
    notes: z.string().optional(),
    store_type: z.enum(['dealership', 'direct_sales', 'warehouse']).optional(),
    client_name: z.string().optional(),
    client_phone: z.string().optional(),
    consultant_id: z.coerce.number().optional(),
    dealership_id: z.coerce.number().optional(),
    total_value: z.coerce.number().optional(),
    destination_store_id: z.coerce.number().optional(),
});

const createServiceOrderSchema = baseSchema.superRefine((data, ctx) => {
    const isDealership  = data.store_type === 'dealership';
    const isDirectSales = data.store_type === 'direct_sales';
    const isWarehouse   = data.store_type === 'warehouse';

    if (isWarehouse) {
        if (!data.destination_store_id || data.destination_store_id <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Loja de destino é obrigatória para o Galpão', path: ['destination_store_id'] });
        }
    }

    if (isDealership) {
        if (!data.consultant_id || data.consultant_id <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Consultor é obrigatório para esta loja', path: ['consultant_id'] });
        }
        if ((data.department === 'film' || data.department === 'ppf') && !data.invoice_number) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nota Fiscal é obrigatória para serviços de Película', path: ['invoice_number'] });
        }
    }

    if (isDirectSales) {
        if (!data.client_name || data.client_name.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nome do cliente é obrigatório', path: ['client_name'] });
        }
        if (!data.client_phone || !data.client_phone.match(/^\(\d{2}\) \d{4,5}-\d{4}$/)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Telefone é obrigatório (formato: (XX) XXXXX-XXXX)', path: ['client_phone'] });
        }
        if (!data.total_value || data.total_value <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor total é obrigatório', path: ['total_value'] });
        }
    }
});

type CreateServiceOrderFormValues = z.infer<typeof createServiceOrderSchema>;

// ─── Steps config ─────────────────────────────────────────────────────────────
const STEPS = [
    { label: 'Veículo',      description: 'Dados do veículo',  icon: Car           },
    { label: 'Serviços',     description: 'Departamento',       icon: Wrench        },
    { label: 'Responsáveis', description: 'Consultor / Origem', icon: Users         },
    { label: 'Revisão',      description: 'Fotos e observações',icon: ClipboardCheck},
];

export default function CreateServiceOrderPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const createServiceOrder = useCreateServiceOrder();

    const [currentStep, setCurrentStep] = useState(0);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [damages, setDamages] = useState<DamagePoint[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('film');

    const { allStores, selectedStoreId } = useStores();

    const selectedStore = useMemo(
        () => allStores?.find((s: Store) => s.id === selectedStoreId),
        [allStores, selectedStoreId]
    );

    const selectedBrand = selectedStore?.dealership_brand ?? undefined;
    const { data: services, isLoading: isLoadingServices } = useServices(selectedDepartment, selectedBrand);

    const groupedCategories = useMemo(() => {
        if (!services?.length) return [];
        const groups: Record<string, typeof services> = {};
        for (const svc of services) {
            const cat = svc.category ?? 'estetica';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(svc);
        }
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [services]);

    const storeType      = selectedStore?.store_type;
    const isDealership   = storeType === 'dealership';
    const isDirectSales  = storeType === 'direct_sales';
    const isWarehouse    = storeType === 'warehouse';

    const { consultants, isLoading: isLoadingConsultants } = useConsultants(
        selectedStoreId ? { store_id: selectedStoreId, is_active: true } : undefined
    );

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
            external_os_number: '',
            invoice_number: '',
            notes: '',
            consultant_id: undefined,
            store_type: undefined,
            destination_store_id: undefined,
        },
    });

    useEffect(() => {
        if (selectedStore && selectedStoreId) {
            form.setValue('location_id', selectedStoreId);
            form.setValue('store_type', selectedStore.store_type);
            if (selectedStore.store_type === 'dealership' && selectedStore.dealership_id) {
                form.setValue('dealership_id', selectedStore.dealership_id);
            } else {
                form.setValue('dealership_id', undefined);
            }
            form.setValue('consultant_id', undefined);
            form.setValue('destination_store_id', undefined);
        }
    }, [selectedStoreId, selectedStore, form]);

    const onSubmit = async (data: CreateServiceOrderFormValues) => {
        setIsUploading(true);
        try {
            let photoUrls: string[] = [];
            if (photos.length > 0) {
                const uploadedPhotos = await uploadService.uploadPhotos(photos);
                photoUrls = uploadedPhotos.map((p) => p.url);
            }

            const payload: any = {
                store_id:      data.location_id,
                department:    data.department,
                entry_time:    new Date().toISOString(),
                vehicle_plate: data.plate,
                vehicle_model: data.vehicle_model,
                vehicle_color: data.vehicle_color,
                items:         data.selected_services.map(id => ({ service_id: id, quantity: 1 })),
                notes:         data.notes || undefined,
                workers:       [],
            };

            if (photoUrls.length > 0)  payload.photos = photoUrls;
            if (damages.length > 0)    payload.damage_map = damages;
            if (data.invoice_number)   payload.invoice_number = data.invoice_number;

            if (isDealership) {
                if (data.consultant_id)       payload.consultant_id      = Number(data.consultant_id);
                if (data.external_os_number)  payload.external_os_number = data.external_os_number;
            } else if (isDirectSales) {
                payload.client_name  = data.client_name;
                payload.client_phone = data.client_phone;
                payload.total_value  = data.total_value;
            } else if (isWarehouse) {
                if (data.destination_store_id) payload.destination_store_id = data.destination_store_id;
            }

            delete payload.store_type;

            createServiceOrder.mutate(payload, {
                onSuccess: () => {
                    toast({ title: 'Sucesso', description: 'Ordem de serviço criada com sucesso!' });
                    navigate('/service-orders');
                },
                onError: (error: any) => {
                    const detail = error?.response?.data?.detail;
                    const msg = Array.isArray(detail)
                        ? detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(' | ')
                        : (typeof detail === 'string' ? detail : JSON.stringify(detail));
                    toast({ variant: 'destructive', title: 'Erro ao criar O.S.', description: msg || 'Verifique os dados e tente novamente.' });
                }
            });
        } catch {
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Falha ao enviar as fotos. Tente novamente.' });
        } finally {
            setIsUploading(false);
        }
    };

    // ─── Step fields (fields to validate per step before advancing) ──────────
    const stepFields: (keyof CreateServiceOrderFormValues)[][] = [
        // Step 0 — Veículo
        ['vehicle_model', 'vehicle_color', 'plate',
         ...(isDirectSales ? ['client_name', 'client_phone'] as const : [])],
        // Step 1 — Serviços
        ['department', 'selected_services',
         ...(isDirectSales ? ['total_value'] as const : [])],
        // Step 2 — Responsáveis
        [...(isDealership  ? ['consultant_id'] as const    : []),
         ...(isWarehouse   ? ['destination_store_id'] as const : [])],
        // Step 3 — Revisão / submit
        [],
    ];

    const goNext = async () => {
        const fields = stepFields[currentStep];
        const valid = fields.length === 0 || await form.trigger(fields as any);
        if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

    const storeTypeBadgeVariant = isWarehouse ? 'outline' : isDealership ? 'default' : 'secondary';
    const storeTypeLabel        = isWarehouse ? 'Galpão'  : isDealership ? 'Repasse' : 'Venda Direta';

    return (
        <div className="max-w-3xl mx-auto pb-12 space-y-6 page-enter">
            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/service-orders')} className="hover:bg-aems-neutral-100">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-bold text-aems-neutral-700 tracking-tight">Nova Ordem de Serviço</h1>
                        {selectedStore && (
                            <Badge variant={storeTypeBadgeVariant} className="text-xs">
                                {storeTypeLabel}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-aems-neutral-400 mt-0.5">
                        {selectedStore?.name ?? 'Selecione uma loja no menu superior'}
                    </p>
                </div>
            </div>

            {/* ── Stepper ── */}
            <div className="bg-white border border-aems-neutral-150 rounded-2xl px-6 py-5 shadow-sm">
                <Stepper
                    steps={STEPS.map((s) => ({ label: s.label, description: s.description }))}
                    currentStep={currentStep}
                />
            </div>

            {/* ── Form card ── */}
            <div className="bg-white border border-aems-neutral-150 rounded-2xl shadow-sm overflow-hidden">
                {/* Step header */}
                <div className="px-6 py-4 border-b border-aems-neutral-100 bg-aems-neutral-50/50 flex items-center gap-3">
                    {(() => {
                        const StepIcon = STEPS[currentStep].icon;
                        return <StepIcon className="w-5 h-5 text-aems-primary-500" />;
                    })()}
                    <div>
                        <p className="font-semibold text-aems-neutral-700 text-sm">{STEPS[currentStep].label}</p>
                        <p className="text-xs text-aems-neutral-400">{STEPS[currentStep].description}</p>
                    </div>
                    <span className="ml-auto text-xs text-aems-neutral-300 font-medium">
                        Etapa {currentStep + 1} de {STEPS.length}
                    </span>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="px-6 py-6 space-y-6">

                            {/* ══ STEP 0: Veículo ══════════════════════════════════ */}
                            {currentStep === 0 && (
                                <div className="space-y-5 aems-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {isDirectSales && (
                                            <>
                                                <FormField
                                                    control={form.control as any}
                                                    name="client_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Nome do Cliente <span className="text-aems-error">*</span></FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ex: João Silva" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control as any}
                                                    name="client_phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Telefone <span className="text-aems-error">*</span></FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        <FormField
                                            control={form.control as any}
                                            name="plate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Placa <span className="text-aems-error">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="ABC1D23"
                                                            className="uppercase font-mono tracking-widest"
                                                            maxLength={7}
                                                            {...field}
                                                            onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[\s-]/g, ''))}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Formato Mercosul (ABC1D23) ou antigo (ABC1234)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control as any}
                                            name="vehicle_model"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Modelo <span className="text-aems-error">*</span></FormLabel>
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
                                                    <FormLabel>Cor <span className="text-aems-error">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: Preto Metálico" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 1: Serviços ══════════════════════════════════ */}
                            {currentStep === 1 && (
                                <div className="space-y-5 aems-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FormField
                                            control={form.control as any}
                                            name="department"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Departamento <span className="text-aems-error">*</span></FormLabel>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            setSelectedDepartment(value);
                                                            form.setValue('selected_services', []);
                                                        }}
                                                        defaultValue={field.value}
                                                    >
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

                                        {isDirectSales && (
                                            <FormField
                                                control={form.control as any}
                                                name="total_value"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Valor Total (R$) <span className="text-aems-error">*</span></FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    {/* Seletor de serviços */}
                                    <FormField
                                        control={form.control as any}
                                        name="selected_services"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Serviços Realizados <span className="text-aems-error">*</span></FormLabel>
                                                <FormControl>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    'w-full justify-between h-auto min-h-[44px]',
                                                                    !field.value?.length && 'text-muted-foreground'
                                                                )}
                                                            >
                                                                {field.value?.length > 0
                                                                    ? `${field.value.length} serviço(s) selecionado(s)`
                                                                    : 'Selecione os serviços...'}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[520px] p-0" align="start">
                                                            <div className="p-2 border-b flex items-center justify-between">
                                                                <p className="text-sm font-medium text-muted-foreground">
                                                                    {selectedBrand ? `Serviços ${selectedBrand.toUpperCase()}` : 'Selecione os serviços'}
                                                                </p>
                                                                {field.value?.length > 0 && (
                                                                    <span className="text-xs text-primary font-medium">{field.value.length} selecionado(s)</span>
                                                                )}
                                                            </div>
                                                            {isLoadingServices ? (
                                                                <div className="p-4 text-center text-sm text-muted-foreground">Carregando serviços...</div>
                                                            ) : !groupedCategories.length ? (
                                                                <div className="p-4 text-center text-sm text-muted-foreground">Nenhum serviço encontrado para esta loja.</div>
                                                            ) : (
                                                                <Tabs defaultValue={groupedCategories[0]?.[0]} className="w-full">
                                                                    <div className="border-b">
                                                                        <ScrollArea className="w-full" type="scroll">
                                                                            <TabsList className="h-auto flex-wrap justify-start gap-1 p-2 bg-transparent rounded-none w-max">
                                                                                {groupedCategories.map(([cat]) => (
                                                                                    <TabsTrigger key={cat} value={cat} className="text-xs px-2 py-1 h-7">
                                                                                        {CATEGORY_LABELS[cat] ?? cat}
                                                                                    </TabsTrigger>
                                                                                ))}
                                                                            </TabsList>
                                                                        </ScrollArea>
                                                                    </div>
                                                                    <ScrollArea className="h-[220px]">
                                                                        {groupedCategories.map(([cat, catServices]) => (
                                                                            <TabsContent key={cat} value={cat} className="mt-0 p-1">
                                                                                {catServices.map((service) => (
                                                                                    <div
                                                                                        key={service.id}
                                                                                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                                                                        onClick={() => {
                                                                                            const current = field.value || [];
                                                                                            const isSelected = current.includes(service.id);
                                                                                            field.onChange(isSelected
                                                                                                ? current.filter((id: number) => id !== service.id)
                                                                                                : [...current, service.id]
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <div className={cn(
                                                                                            'flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0',
                                                                                            field.value?.includes(service.id) ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                                                                                        )}>
                                                                                            <Check className="h-4 w-4" />
                                                                                        </div>
                                                                                        <span className="text-sm">{service.name}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </TabsContent>
                                                                        ))}
                                                                    </ScrollArea>
                                                                </Tabs>
                                                            )}
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormControl>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {field.value?.map((serviceId: number) => {
                                                        const service = services?.find((s) => s.id === serviceId);
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
                            )}

                            {/* ══ STEP 2: Responsáveis ═════════════════════════════ */}
                            {currentStep === 2 && (
                                <div className="space-y-5 aems-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {isWarehouse && (
                                            <FormField
                                                control={form.control as any}
                                                name="destination_store_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Loja de Destino <span className="text-aems-error">*</span></FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value?.toString()}
                                                            disabled={!selectedStoreId}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione a loja de destino" />
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

                                        {isDealership && (
                                            <>
                                                <FormField
                                                    control={form.control as any}
                                                    name="consultant_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Consultor <span className="text-aems-error">*</span></FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value?.toString()}
                                                                disabled={!selectedStoreId}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecione o consultor" />
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
                                                            <FormDescription>Obrigatório para esta loja</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control as any}
                                                    name="external_os_number"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Nº OS da Concessionária</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ex: 12345" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        {isDirectSales && (
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-3 p-4 bg-aems-success-light border border-aems-success/20 rounded-xl text-sm text-aems-success">
                                                    <Check className="w-4 h-4 flex-shrink-0" />
                                                    <span>Venda direta — não requer consultor ou concessionária.</span>
                                                </div>
                                            </div>
                                        )}

                                        {!isDealership && !isWarehouse && !isDirectSales && (
                                            <div className="col-span-2 text-sm text-aems-neutral-400 italic py-4 text-center">
                                                Selecione uma loja no menu superior para ver opções de responsáveis.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 3: Revisão ══════════════════════════════════ */}
                            {currentStep === 3 && (
                                <div className="space-y-6 aems-fade-in">
                                    {/* NF para película em dealership */}
                                    {isDealership && FILM_DEPARTMENTS.includes(selectedDepartment) && (
                                        <FormField
                                            control={form.control as any}
                                            name="invoice_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nota Fiscal <span className="text-aems-error">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: 123456" {...field} />
                                                    </FormControl>
                                                    <FormDescription>Obrigatória para serviços de Película em lojas Repasse</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {/* NF opcional para venda direta + película */}
                                    {isDirectSales && FILM_DEPARTMENTS.includes(selectedDepartment) && (
                                        <FormField
                                            control={form.control as any}
                                            name="invoice_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Número da Nota Fiscal</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: 123456" {...field} />
                                                    </FormControl>
                                                    <FormDescription>Opcional para venda direta</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {/* Fotos */}
                                    {isDirectSales && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-aems-neutral-700 mb-3">
                                                Fotos do Veículo
                                                <span className="ml-2 text-xs font-normal text-aems-neutral-400">opcional</span>
                                            </h4>
                                            <PhotoUploader
                                                photos={photos}
                                                onPhotosChange={setPhotos}
                                                minPhotos={0}
                                                maxPhotos={10}
                                            />
                                        </div>
                                    )}

                                    {/* Mapa de avarias */}
                                    {isDirectSales && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-aems-neutral-700 mb-3">
                                                Mapa de Avarias
                                                <span className="ml-2 text-xs font-normal text-aems-neutral-400">opcional</span>
                                            </h4>
                                            <DamageMap damages={damages} onDamagesChange={setDamages} />
                                        </div>
                                    )}

                                    {/* Observações */}
                                    <FormField
                                        control={form.control as any}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Observações Gerais</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Outras informações relevantes..."
                                                        className="min-h-[80px] resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Resumo da OS */}
                                    <div className="bg-aems-neutral-50 border border-aems-neutral-150 rounded-xl p-4 space-y-2 text-sm">
                                        <p className="font-semibold text-aems-neutral-600 text-xs uppercase tracking-wide mb-3">Resumo da O.S.</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-aems-neutral-600">
                                            <span className="text-aems-neutral-400">Placa</span>
                                            <span className="font-mono font-bold tracking-widest">{form.watch('plate') || '—'}</span>
                                            <span className="text-aems-neutral-400">Modelo</span>
                                            <span>{form.watch('vehicle_model') || '—'}</span>
                                            <span className="text-aems-neutral-400">Departamento</span>
                                            <span>{DEPARTMENTS.find(d => d.value === form.watch('department'))?.label || '—'}</span>
                                            <span className="text-aems-neutral-400">Serviços</span>
                                            <span>{form.watch('selected_services')?.length ?? 0} selecionado(s)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* ── Navigation footer ── */}
                        <div className="px-6 py-4 border-t border-aems-neutral-100 bg-aems-neutral-50/50 flex items-center justify-between gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={currentStep === 0 ? () => navigate('/service-orders') : goPrev}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                {currentStep === 0 ? 'Cancelar' : 'Anterior'}
                            </Button>

                            <div className="flex items-center gap-1.5">
                                {STEPS.map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={cn(
                                            'w-1.5 h-1.5 rounded-full transition-all duration-200',
                                            idx === currentStep
                                                ? 'bg-aems-primary-400 w-4'
                                                : idx < currentStep
                                                ? 'bg-aems-primary-300'
                                                : 'bg-aems-neutral-200'
                                        )}
                                    />
                                ))}
                            </div>

                            {currentStep < STEPS.length - 1 ? (
                                <Button
                                    type="button"
                                    onClick={goNext}
                                    className="gap-2 bg-aems-primary-400 hover:bg-aems-primary-500 text-aems-neutral-900 font-semibold"
                                >
                                    Próximo
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={createServiceOrder.isPending || isUploading}
                                    className="gap-2 bg-aems-primary-400 hover:bg-aems-primary-500 text-aems-neutral-900 font-semibold"
                                >
                                    {(createServiceOrder.isPending || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isUploading ? 'Enviando Fotos...' : 'Criar Ordem de Serviço'}
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
