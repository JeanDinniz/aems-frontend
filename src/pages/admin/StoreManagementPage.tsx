import { useState, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Store, Building2, Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

const STORE_TYPE_LABELS: Record<StoreType['store_type'], string> = {
    dealership: 'Concessionária',
    warehouse: 'Galpão',
};

const STORE_TYPE_VARIANTS: Record<StoreType['store_type'], 'default' | 'secondary' | 'outline'> = {
    dealership: 'default',
    warehouse: 'outline',
};

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
    store_type: z.enum(['dealership', 'warehouse']),
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
            store_type: 'dealership',
            dealership_brand: null,
            phone: '',
            address: '',
        },
    });

    // Atualiza o código sugerido quando o dialog abre
    const storeType = form.watch('store_type');

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
                store_type: data.store_type,
                dealership_brand: data.store_type === 'dealership' ? (data.dealership_brand || null) : null,
                phone: data.phone || null,
                address: data.address || null,
            });
        },
        [createMutation]
    );

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) form.reset({ code: nextCode }); }}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Nova Loja</DialogTitle>
                    <DialogDescription>
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
                                    <FormLabel>Nome da Loja *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: AEMS Toyota - Centro" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: LJ13"
                                                maxLength={4}
                                                className="uppercase font-mono"
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
                                name="store_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="dealership">Concessionária</SelectItem>
                                                <SelectItem value="warehouse">Galpão</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {storeType === 'dealership' && (
                            <FormField
                                control={form.control}
                                name="dealership_brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marca da Concessionária</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ''}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a marca" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DEALERSHIP_BRANDS.map((b) => (
                                                    <SelectItem key={b.value} value={b.value}>
                                                        {b.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="(XX) XXXXX-XXXX" {...field} />
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
                                    <FormLabel>Endereço</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Rua, número, bairro" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={createMutation.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
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
    store_type: z.enum(['dealership', 'warehouse']),
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
                  store_type: store.store_type,
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
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Editar Loja</DialogTitle>
                    <DialogDescription>
                        Atualize os dados de{' '}
                        <span className="font-semibold">{store?.code}</span> —{' '}
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
                                    <FormLabel>Nome da Loja</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: AEMS Toyota - Centro" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="store_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Loja</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="dealership">Concessionária</SelectItem>
                                            <SelectItem value="warehouse">Galpão</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(val === 'true')}
                                        value={field.value ? 'true' : 'false'}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="true">Ativo</SelectItem>
                                            <SelectItem value="false">Inativo</SelectItem>
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
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: São Paulo" {...field} />
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
                                        <FormLabel>Estado</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: SP" maxLength={2} {...field} />
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
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="(XX) XXXXX-XXXX" {...field} />
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
                                    <FormLabel>Endereço</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Rua, número, bairro" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={updateMutation.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
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
    const [typeFilter, setTypeFilter] = useState<StoreType['store_type'] | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [editStore, setEditStore] = useState<StoreType | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [storeToDelete, setStoreToDelete] = useState<StoreType | null>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const deleteMutation = useMutation({
        mutationFn: (id: number) => storesService.delete(id),
        onSuccess: (deactivated) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast({ title: `Loja ${deactivated.code} desativada com sucesso.` });
            setStoreToDelete(null);
        },
        onError: () => {
            toast({
                variant: 'destructive',
                title: 'Erro ao desativar loja',
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

            const matchesType = typeFilter === 'all' || store.store_type === typeFilter;

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && store.is_active) ||
                (statusFilter === 'inactive' && !store.is_active);

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [stores, search, typeFilter, statusFilter]);

    // Calcula o próximo código de loja disponível (LJ01, LJ02, ...)
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
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        Gestão de Lojas
                    </h1>
                    <p className="text-muted-foreground">
                        Visualize e edite as configurações das{' '}
                        <span className="font-medium">{stores.length} lojas</span> da rede
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Loja
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select
                    value={typeFilter}
                    onValueChange={(val) => setTypeFilter(val as typeof typeFilter)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tipo de loja" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="dealership">Concessionária</SelectItem>
                        <SelectItem value="warehouse">Galpão</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
                {filteredStores.length} loja(s) encontrada(s)
            </p>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Cidade / Estado</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 6 }).map((__, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : filteredStores.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    Nenhuma loja encontrada com os filtros aplicados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStores.map((store) => (
                                <TableRow key={store.id}>
                                    <TableCell>
                                        <span className="font-mono font-semibold text-sm">
                                            {store.code}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium">{store.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {store.city && store.state
                                            ? `${store.city} / ${store.state}`
                                            : store.city || store.state || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={STORE_TYPE_VARIANTS[store.store_type]}>
                                            {STORE_TYPE_LABELS[store.store_type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={store.is_active ? 'default' : 'secondary'}
                                            className={
                                                store.is_active
                                                    ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100'
                                                    : 'bg-gray-100 text-gray-600 border-gray-300'
                                            }
                                        >
                                            {store.is_active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditClick(store)}
                                                aria-label={`Editar loja ${store.name}`}
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(store)}
                                                aria-label={`Desativar loja ${store.name}`}
                                                className="hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desativar loja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A loja{' '}
                            <span className="font-semibold">
                                {storeToDelete?.code} — {storeToDelete?.name}
                            </span>{' '}
                            será desativada. Esta ação pode ser desfeita editando a loja e reativando-a.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => storeToDelete && deleteMutation.mutate(storeToDelete.id)}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteMutation.isPending ? 'Desativando...' : 'Desativar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
