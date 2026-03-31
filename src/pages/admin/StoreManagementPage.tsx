import { useState, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Store, Building2, Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { storesService, type Store as StoreType, type UpdateStorePayload, type CreateStorePayload } from '@/services/api/stores.service';
import { getApiErrorMessage } from '@/lib/api-error';

const DEALERSHIP_BRANDS = [
    { value: 'byd', label: 'BYD' },
    { value: 'fiat', label: 'FIAT' },
    { value: 'hyundai', label: 'HYUNDAI' },
    { value: 'toyota', label: 'TOYOTA' },
];

const createStoreSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    code: z
        .string()
        .regex(/^LJ\d{2}$/, 'Código deve ser no formato LJ01 a LJ99'),
    dealership_brand: z.string().optional().nullable(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

type CreateStoreFormValues = z.infer<typeof createStoreSchema>;

interface CreateStoreDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nextCode: string;
}

function CreateStoreDialog({ open, onOpenChange, nextCode }: CreateStoreDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const form = useForm<CreateStoreFormValues>({
        resolver: zodResolver(createStoreSchema),
        defaultValues: {
            name: '',
            code: nextCode,
            dealership_brand: null,
            phone: '',
            address: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateStorePayload) => storesService.create(data),
        onSuccess: (newStore) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast({ title: `Loja ${newStore.code} criada com sucesso.` });
            onOpenChange(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Erro ao criar loja',
                description: getApiErrorMessage(error, 'Verifique os dados e tente novamente.'),
            });
        },
    });

    const onSubmit = useCallback(
        (data: CreateStoreFormValues) => {
            createMutation.mutate({
                name: data.name,
                code: data.code,
                store_type: 'dealership',
                dealership_brand: data.dealership_brand || null,
                phone: data.phone || null,
                address: data.address || null,
            });
        },
        [createMutation]
    );

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) form.reset({ code: nextCode }); }}>
            <DialogContent className="sm:max-w-[480px] bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333]">
                <DialogHeader>
                    <DialogTitle className="text-[#111111] dark:text-white">Nova Loja</DialogTitle>
                    <DialogDescription className="text-[#666666] dark:text-zinc-400">
                        Cadastre uma nova unidade para a rede AEMS.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Nome da Loja *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: AEMS Toyota - Centro"
                                            className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Código *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: LJ13"
                                            maxLength={4}
                                            className="uppercase font-mono bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dealership_brand"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Marca da Concessionária</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                                <SelectValue placeholder="Selecione a marca" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                            {DEALERSHIP_BRANDS.map((b) => (
                                                <SelectItem key={b.value} value={b.value} className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                                    {b.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Telefone</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="(XX) XXXXX-XXXX"
                                            className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Endereço</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Rua, número, bairro"
                                            className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={createMutation.isPending}
                                className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="font-semibold"
                                style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                            >
                                {createMutation.isPending ? 'Criando...' : 'Criar Loja'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const editStoreSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    is_active: z.boolean(),
    city: z.string().optional(),
    state: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
});

type EditStoreFormValues = z.infer<typeof editStoreSchema>;

interface EditStoreDialogProps {
    store: StoreType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function EditStoreDialog({ store, open, onOpenChange }: EditStoreDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const form = useForm<EditStoreFormValues>({
        resolver: zodResolver(editStoreSchema),
        values: store
            ? {
                  name: store.name,
                  is_active: store.is_active,
                  city: store.city ?? '',
                  state: store.state ?? '',
                  address: store.address ?? '',
                  phone: store.phone ?? '',
              }
            : undefined,
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateStorePayload) => storesService.update(store!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast({ title: 'Loja atualizada com sucesso.' });
            onOpenChange(false);
        },
        onError: () => {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Falha ao atualizar a loja. Tente novamente.',
            });
        },
    });

    const onSubmit = useCallback(
        (data: EditStoreFormValues) => {
            updateMutation.mutate(data);
        },
        [updateMutation]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333]">
                <DialogHeader>
                    <DialogTitle className="text-[#111111] dark:text-white">Editar Loja</DialogTitle>
                    <DialogDescription className="text-[#666666] dark:text-zinc-400">
                        Atualize os dados de{' '}
                        <span className="font-semibold text-[#111111] dark:text-zinc-200">{store?.code}</span> —{' '}
                        {store?.name}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Nome da Loja</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: AEMS Toyota - Centro"
                                            className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Status</FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(val === 'true')}
                                        value={field.value ? 'true' : 'false'}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                                <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                            <SelectItem value="true" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Ativo</SelectItem>
                                            <SelectItem value="false" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#666666] dark:text-zinc-300">Cidade</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: São Paulo"
                                                className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#666666] dark:text-zinc-300">Estado</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: SP"
                                                maxLength={2}
                                                className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Telefone</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="(XX) XXXXX-XXXX"
                                            className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#666666] dark:text-zinc-300">Endereço</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Rua, número, bairro"
                                            className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={updateMutation.isPending}
                                className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="font-semibold"
                                style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                            >
                                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function StoreManagementPage() {
    const { user } = useAuth();
    const isOwner = user?.role === 'owner';

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [editStore, setEditStore] = useState<StoreType | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [storeToDelete, setStoreToDelete] = useState<StoreType | null>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const deleteMutation = useMutation({
        mutationFn: (id: number) => storesService.delete(id),
        onSuccess: (deleted) => {
            queryClient.setQueryData<StoreType[]>(['stores'], (old) =>
                old ? old.filter((s) => s.id !== deleted.id) : []
            );
            toast({ title: `Loja ${deleted.code} excluída com sucesso.` });
            setStoreToDelete(null);
        },
        onError: () => {
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir loja',
                description: 'Verifique se a loja não possui vínculos ativos e tente novamente.',
            });
        },
    });

    const { data: stores = [], isLoading } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
        enabled: isOwner,
        staleTime: 1000 * 60 * 60,
    });

    const filteredStores = useMemo(() => {
        return stores.filter((store) => {
            const matchesSearch =
                search.trim() === '' ||
                store.name.toLowerCase().includes(search.toLowerCase()) ||
                store.code.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && store.is_active) ||
                (statusFilter === 'inactive' && !store.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [stores, search, statusFilter]);

    const nextStoreCode = useMemo(() => {
        const codes = stores
            .map((s) => s.code.match(/^LJ(\d{2})$/)?.at(1))
            .filter(Boolean)
            .map(Number);
        const max = codes.length > 0 ? Math.max(...codes) : 0;
        return `LJ${String(max + 1).padStart(2, '0')}`;
    }, [stores]);

    const handleEditClick = useCallback((store: StoreType) => {
        setEditStore(store);
        setEditDialogOpen(true);
    }, []);

    const handleDeleteClick = useCallback((store: StoreType) => {
        setStoreToDelete(store);
    }, []);

    if (!isOwner) {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-[#111111] dark:text-white text-2xl font-bold flex items-center gap-2"
                        style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                    >
                        <Building2 className="h-6 w-6" style={{ color: '#F5A800' }} />
                        Gestão de Lojas
                    </h1>
                    <p className="text-[#666666] dark:text-zinc-400 text-sm">
                        Visualize e edite as configurações das{' '}
                        <span className="font-medium text-[#333333] dark:text-zinc-300">{stores.length} lojas</span> da rede
                    </p>
                </div>
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="font-semibold"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Loja
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Buscar por nome ou código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                    />
                </div>

                <Select
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
                >
                    <SelectTrigger className="w-[150px] bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                        <SelectItem value="all" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Todos os status</SelectItem>
                        <SelectItem value="active" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Ativo</SelectItem>
                        <SelectItem value="inactive" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Inativo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-[#666666] dark:text-zinc-400">
                {filteredStores.length} loja(s) encontrada(s)
            </p>

            {/* Table */}
            <div className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-zinc-800/60">
                        <tr>
                            <th className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3 text-left w-24">Código</th>
                            <th className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3 text-left">Nome</th>
                            <th className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3 text-left">Cidade / Estado</th>
                            <th className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3 text-left">Status</th>
                            <th className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="border-t border-[#E8E8E8] dark:border-[#333333]">
                                    {Array.from({ length: 5 }).map((__, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <Skeleton className="h-5 w-full bg-gray-200 dark:bg-zinc-800 animate-pulse rounded" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : filteredStores.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="text-center py-12 text-[#999999] dark:text-zinc-500"
                                >
                                    Nenhuma loja encontrada com os filtros aplicados.
                                </td>
                            </tr>
                        ) : (
                            filteredStores.map((store) => (
                                <tr key={store.id} className="border-t border-[#E8E8E8] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors">
                                    <td className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200">
                                        <span className="font-mono font-semibold text-sm text-[#111111] dark:text-zinc-100">
                                            {store.code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200 font-medium">{store.name}</td>
                                    <td className="px-4 py-3 text-sm text-[#666666] dark:text-zinc-400">
                                        {store.city && store.state
                                            ? `${store.city} / ${store.state}`
                                            : store.city || store.state || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200">
                                        {store.is_active ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700/50">
                                                Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-[#666666] dark:text-zinc-400 border border-[#D1D1D1] dark:border-zinc-700">
                                                Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(store)}
                                                aria-label={`Editar loja ${store.name}`}
                                                className="h-7 w-7 text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(store)}
                                                aria-label={`Excluir loja ${store.name}`}
                                                className="h-7 w-7 text-[#666666] dark:text-zinc-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Dialog */}
            <EditStoreDialog
                store={editStore}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            {/* Create Dialog */}
            <CreateStoreDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                nextCode={nextStoreCode}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!storeToDelete}
                onOpenChange={(open) => { if (!open) setStoreToDelete(null); }}
            >
                <AlertDialogContent className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#111111] dark:text-white">Excluir loja?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#666666] dark:text-zinc-400">
                            A loja{' '}
                            <span className="font-semibold text-[#111111] dark:text-zinc-200">
                                {storeToDelete?.code} — {storeToDelete?.name}
                            </span>{' '}
                            será excluída permanentemente. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={deleteMutation.isPending}
                            className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => storeToDelete && deleteMutation.mutate(storeToDelete.id)}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
