import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useServiceOrder, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
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
    { value: 'vn', label: 'VN (Veículos Novos)' },
    { value: 'vu', label: 'VU (Veículos Usados)' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'workshop', label: 'Oficina' },
];

const editServiceOrderSchema = z.object({
    client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
    client_phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato inválido: (XX) XXXXX-XXXX').min(1, 'Telefone é obrigatório'),
    vehicle_model: z.string().min(2, 'Modelo do veículo é obrigatório'),
    vehicle_color: z.string().min(2, 'Cor do veículo é obrigatória'),
    plate: z.string().regex(/^[A-Z]{3}\d[A-Z\d]\d{2}$/, 'Placa inválida (Mercosul ou Antiga)'),

    department: z.enum(['film', 'vn', 'vu', 'bodywork', 'workshop']),
    service_description: z.string().min(10, 'Descrição do serviço deve ter no mínimo 10 caracteres'),

    dealership_id: z.coerce.number().positive('Selecione uma concessionária'),
    location_id: z.number().default(1),
    technician_id: z.coerce.number().optional(),
    consultant_id: z.coerce.number().optional(),

    total_value: z.coerce.number().positive('Valor deve ser maior que zero'),

    photos: z.array(z.string()).min(4, 'Mínimo 4 fotos obrigatórias'),
    damage_map: z.string().optional(),
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

type EditServiceOrderFormValues = z.infer<typeof editServiceOrderSchema>;

export default function EditServiceOrderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: os, isLoading: isLoadingOS } = useServiceOrder(Number(id));
    const updateServiceOrder = useUpdateServiceOrder();

    const form = useForm<EditServiceOrderFormValues>({
        resolver: zodResolver(editServiceOrderSchema) as any,
        defaultValues: {
            client_name: '',
            client_phone: '',
            vehicle_model: '',
            vehicle_color: '',
            plate: '',
            department: 'film',
            service_description: '',
            dealership_id: 0,
            location_id: 1,
            total_value: 0,
            photos: [],
            damage_map: '',
            invoice_number: '',
            notes: '',
        },
    });



    useEffect(() => {
        if (os) {
            form.reset({
                client_name: os.client_name,
                client_phone: os.client_phone,
                vehicle_model: os.vehicle_model || '',
                vehicle_color: os.vehicle_color || '',
                plate: os.plate || 'ABC1234', // fallback if old data missing
                department: os.department || 'film',
                service_description: os.service_description || (os.service_type ? `${os.service_type} - ${os.film_type}` : ''),
                dealership_id: os.dealership_id || 1, // fallback
                location_id: os.location_id,
                total_value: os.total_value,
                photos: os.photos || ['https://placehold.co/600x400', 'https://placehold.co/600x400', 'https://placehold.co/600x400', 'https://placehold.co/600x400'], // Mock if missing for validation
                damage_map: os.damage_map || '',
                invoice_number: os.invoice_number || '',
                notes: os.notes || '',
                technician_id: os.technician_id || undefined,
                consultant_id: os.consultant_id || undefined,
            });
        }
    }, [os, form]);

    const onSubmit = (data: EditServiceOrderFormValues) => {
        updateServiceOrder.mutate(
            {
                id: Number(id),
                data: data as any
            },
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

    if (isLoadingOS) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const selectedDepartment = form.watch('department');

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
                        <div>
                            <h3 className="text-lg font-medium mb-4">Dados do Cliente e Veículo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                <Input placeholder="ABC1D23" className="uppercase" {...field} maxLength={7} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

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

                                <FormItem className="col-span-1 md:col-span-2">
                                    <FormField
                                        control={form.control as any}
                                        name="service_description"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Descrição do Serviço *</FormLabel>
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
                            </div>
                        </div>

                        {/* SECTION 3: Origem e Responsáveis */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Origem e Responsáveis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="dealership_id"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Concessionária *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} value={field.value?.toString()}>
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
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Consultor Técnico</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} value={field.value?.toString()}>
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
                            </div>

                            {/* Photos */}
                            <FormField
                                control={form.control as any}
                                name="photos"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fotos do Veículo (Mínimo 4) *</FormLabel>
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
                                                                const newPhotos = [...field.value];
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
