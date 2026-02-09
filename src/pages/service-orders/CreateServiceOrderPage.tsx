import { useState } from 'react';
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

// Enums for Departments
const DEPARTMENTS: { value: Department; label: string }[] = [
    { value: 'film', label: 'Película' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'aesthetic', label: 'Estética' }
];

// Zod Schema (Removed photos and damage_map from validation here as they are handled separately)
// We will validate them manually in onSubmit
const createServiceOrderSchema = z.object({
    client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
    client_phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato inválido: (XX) XXXXX-XXXX').min(1, 'Telefone é obrigatório'),
    client_vehicle: z.string().min(2, 'Veículo é obrigatório'),
    plate: z.string().regex(/^[A-Z]{3}\d[A-Z\d]\d{2}$/, 'Placa inválida (Mercosul ou Antiga)'),

    department: z.enum(['film', 'bodywork', 'aesthetic']),
    service_description: z.string().min(10, 'Descrição do serviço deve ter no mínimo 10 caracteres'),

    dealership_id: z.coerce.number().positive('Selecione uma concessionária'),
    location_id: z.number().default(1),
    technician_id: z.coerce.number().optional(),
    consultant_id: z.coerce.number().optional(),

    total_value: z.coerce.number().positive('Valor deve ser maior que zero'),

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
        path: ['invoice_number']
    }
);

type CreateServiceOrderFormValues = z.infer<typeof createServiceOrderSchema>;

export default function CreateServiceOrderPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const createServiceOrder = useCreateServiceOrder();

    // Custom state for new components
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [damages, setDamages] = useState<DamagePoint[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<CreateServiceOrderFormValues>({
        resolver: zodResolver(createServiceOrderSchema) as any,
        defaultValues: {
            client_name: '',
            client_phone: '',
            client_vehicle: '',
            plate: '',
            department: 'film',
            service_description: '',
            dealership_id: 0,
            location_id: 1,
            total_value: 0,
            invoice_number: '',
            notes: '',
        },
    });

    const onSubmit = async (data: CreateServiceOrderFormValues) => {
        // 1. Validate Photos
        if (photos.length < 4) {
            toast({
                variant: 'destructive',
                title: 'Fotos obrigatórias',
                description: 'Adicione pelo menos 4 fotos do veículo antes de continuar.',
            });
            return;
        }

        setIsUploading(true);

        try {
            // 2. Upload Photos
            const uploadedPhotos = await uploadService.uploadPhotos(photos);
            const photoUrls = uploadedPhotos.map((p) => p.url);

            // 3. Prepare Payload (merging form data with photo URLs and damage map)
            const payload = {
                ...data,
                photos: photoUrls, // API expects 'photos' array of strings
                damage_map: damages, // API expects 'damage_map' (assuming it can take object/json)
            };

            // 4. Submit
            createServiceOrder.mutate(payload as any, {
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

    const selectedDepartment = form.watch('department');

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/service-orders')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nova Ordem de Serviço</h1>
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
                            <h3 className="text-lg font-medium mb-4">Dados do Cliente e Veículo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <FormField
                                    control={form.control as any}
                                    name="client_vehicle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Veículo *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Honda Civic 2024" {...field} />
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
                                            <FormLabel>Placa *</FormLabel>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                                <FormItem className="col-span-1 md:col-span-2">
                                    <FormField
                                        control={form.control as any}
                                        name="service_description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descrição do Serviço *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Descreva o serviço a ser realizado..."
                                                        className="min-h-[80px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </FormItem>
                            </div>
                        </div>

                        {/* SECTION 3: Origem e Responsáveis */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Origem e Responsáveis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="dealership_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Concessionária *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {/* Mock Data */}
                                                    <SelectItem value="1">Honda Plaza</SelectItem>
                                                    <SelectItem value="2">Toyota Sulpar</SelectItem>
                                                    <SelectItem value="3">Viancar</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="consultant_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Consultor Técnico</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione (Opcional)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {/* Mock Data */}
                                                    <SelectItem value="101">Carlos Souza</SelectItem>
                                                    <SelectItem value="102">Ana Pereira</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* SECTION 4: Documentação Específica & Fotos */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Documentação e Vistoria</h3>

                            <div className="mb-6">
                                {selectedDepartment === 'film' && (
                                    <FormField
                                        control={form.control as any}
                                        name="invoice_number"
                                        render={({ field }) => (
                                            <FormItem className="mb-6">
                                                <FormLabel>Número da Nota Fiscal *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: 123456" {...field} />
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

                            {/* New PhotoUploader Component */}
                            <div className="mb-8">
                                <h4 className="text-sm font-medium mb-3">Fotos do Veículo *</h4>
                                <PhotoUploader
                                    photos={photos}
                                    onPhotosChange={setPhotos}
                                    minPhotos={4}
                                    maxPhotos={10}
                                />
                            </div>

                            {/* New DamageMap Component */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium mb-3">Mapa de Avarias</h4>
                                <DamageMap
                                    damages={damages}
                                    onDamagesChange={setDamages}
                                />
                            </div>
                        </div>

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

