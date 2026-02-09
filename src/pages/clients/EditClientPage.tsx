import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUpdateClient, useClient } from '@/hooks/useClients';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2')
        .slice(0, 15);
};

const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .slice(0, 9);
};

const maskCPFOrCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
        return clean
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14);
    } else {
        return clean
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18);
    }
};

const schema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    phone: z.string().min(14, 'Telefone inválido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    document: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
    zipcode: z.string().min(9, 'CEP inválido').optional().or(z.literal('')),
    notes: z.string().optional()
});

type CreateClientFormValues = z.infer<typeof schema>;

export function EditClientPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const updateClient = useUpdateClient();
    const { data: client, isLoading } = useClient(Number(id));

    const form = useForm<CreateClientFormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            document: '',
            address: '',
            city: '',
            state: '',
            zipcode: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (client) {
            form.reset({
                name: client.name,
                phone: client.phone,
                email: client.email || '',
                document: client.document || '',
                address: client.address || '',
                city: client.city || '',
                state: client.state || '',
                zipcode: client.zipcode || '',
                notes: client.notes || '',
            });
        }
    }, [client, form]);

    const onSubmit = (data: CreateClientFormValues) => {
        updateClient.mutate({ id: Number(id), data }, {
            onSuccess: () => {
                toast({
                    title: 'Cliente atualizado',
                    description: 'Os dados do cliente foram atualizados.',
                });
                navigate('/clients');
            },
            onError: (error) => {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: 'Erro ao atualizar cliente.',
                });
            }
        });
    };

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-[400px]" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/clients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
            </div>

            <div className="rounded-md border p-6 bg-card">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Dados Pessoais */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Dados Pessoais</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="João da Silva" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="(11) 99999-9999"
                                                    {...field}
                                                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="joao@email.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="document"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CPF / CNPJ</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="000.000.000-00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(maskCPFOrCNPJ(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Endereço</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="zipcode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CEP</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="00000-000"
                                                    {...field}
                                                    onChange={(e) => field.onChange(maskCEP(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Endereço</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Rua Exemplo, 123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cidade</FormLabel>
                                            <FormControl>
                                                <Input placeholder="São Paulo" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="UF" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="SP">São Paulo</SelectItem>
                                                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                                    <SelectItem value="MG">Minas Gerais</SelectItem>
                                                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                                                    <SelectItem value="PR">Paraná</SelectItem>
                                                    {/* Add other states as needed */}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Observações</h2>
                            <FormField
                                control={form.control as any}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notas Internas</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Informações adicionais sobre o cliente..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link to="/clients">
                                <Button type="button" variant="outline">Cancelar</Button>
                            </Link>
                            <Button type="submit" disabled={updateClient.isPending}>
                                {updateClient.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
