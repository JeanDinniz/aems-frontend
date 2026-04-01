import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { storesService } from '@/services/api/stores.service';
import { useCreateAccessProfile, useUpdateAccessProfile } from '@/hooks/useAccessProfiles';
import type { AccessProfile, AccessProfileCreate, ModulePermission, SubModule, ModuleGroup } from '@/types/accessProfile.types';

// ------ Schema and definitions ------

const SUB_MODULE_LABELS: Record<SubModule, string> = {
    users: 'Usuários',
    stores: 'Lojas',
    consultants: 'Consultores',
    employees: 'Funcionários',
    brands: 'Marcas',
    models: 'Modelos',
    services: 'Serviços',
    profiles: 'Perfis de Acesso',
    service_orders: 'Ordens de Serviço',
    conference: 'Conferência',
    fechamento: 'Fechamento',
};

interface PermissionRow {
    module_group: ModuleGroup;
    sub_module: SubModule;
    label: string;
}

const ADM_PERMISSIONS: PermissionRow[] = [
    { module_group: 'ADM', sub_module: 'users', label: 'Usuários' },
    { module_group: 'ADM', sub_module: 'stores', label: 'Lojas' },
    { module_group: 'ADM', sub_module: 'consultants', label: 'Consultores' },
    { module_group: 'ADM', sub_module: 'employees', label: 'Funcionários' },
    { module_group: 'ADM', sub_module: 'brands', label: 'Marcas' },
    { module_group: 'ADM', sub_module: 'models', label: 'Modelos' },
    { module_group: 'ADM', sub_module: 'services', label: 'Serviços' },
    { module_group: 'ADM', sub_module: 'profiles', label: 'Perfis de Acesso' },
];

const OPERACIONAL_PERMISSIONS: PermissionRow[] = [
    { module_group: 'OPERACIONAL', sub_module: 'service_orders', label: 'Ordens de Serviço' },
    { module_group: 'OPERACIONAL', sub_module: 'conference', label: 'Conferência' },
    { module_group: 'OPERACIONAL', sub_module: 'fechamento', label: 'Fechamento' },
];

const ALL_PERMISSIONS: PermissionRow[] = [...ADM_PERMISSIONS, ...OPERACIONAL_PERMISSIONS];

// ------ Form schema ------

const formSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    description: z.string().optional(),
    is_active: z.boolean(),
    allows_loja: z.boolean(),
    allows_galpon: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

// ------ Types ------

type PermState = Record<SubModule, { can_view: boolean; can_edit: boolean; can_delete: boolean }>;

const defaultPermState = (): PermState =>
    Object.fromEntries(
        ALL_PERMISSIONS.map((p) => [
            p.sub_module,
            { can_view: false, can_edit: false, can_delete: false },
        ])
    ) as PermState;

interface AccessProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile?: AccessProfile | null;
}

// ------ Component ------

export function AccessProfileDialog({ open, onOpenChange, profile }: AccessProfileDialogProps) {
    const isEdit = !!profile;
    const createMutation = useCreateAccessProfile();
    const updateMutation = useUpdateAccessProfile();

    const [permState, setPermState] = useState<PermState>(defaultPermState);
    const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());

    const { data: stores = [], isLoading: storesLoading } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
        staleTime: 1000 * 60 * 10,
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            is_active: true,
            allows_loja: true,
            allows_galpon: false,
        },
    });

    // Populate form when editing
    useEffect(() => {
        if (open) {
            if (profile) {
                reset({
                    name: profile.name,
                    description: profile.description ?? '',
                    is_active: profile.is_active,
                    allows_loja: profile.allows_loja,
                    allows_galpon: profile.allows_galpon,
                });

                const newPerms = defaultPermState();
                for (const perm of profile.permissions) {
                    newPerms[perm.sub_module] = {
                        can_view: perm.can_view,
                        can_edit: perm.can_edit,
                        can_delete: perm.can_delete,
                    };
                }
                setPermState(newPerms);
                setSelectedStoreIds(new Set(profile.store_ids));
            } else {
                reset({
                    name: '',
                    description: '',
                    is_active: true,
                    allows_loja: true,
                    allows_galpon: false,
                });
                setPermState(defaultPermState());
                setSelectedStoreIds(new Set());
            }
        }
    }, [open, profile, reset]);

    const setPerm = (
        sub_module: SubModule,
        field: 'can_view' | 'can_edit' | 'can_delete',
        value: boolean
    ) => {
        setPermState((prev) => ({
            ...prev,
            [sub_module]: { ...prev[sub_module], [field]: value },
        }));
    };

    const toggleStore = (storeId: string) => {
        setSelectedStoreIds((prev) => {
            const next = new Set(prev);
            if (next.has(storeId)) {
                next.delete(storeId);
            } else {
                next.add(storeId);
            }
            return next;
        });
    };

    const buildPermissions = (): Omit<ModulePermission, 'id' | 'profile_id'>[] =>
        ALL_PERMISSIONS.map((row) => ({
            module_group: row.module_group,
            sub_module: row.sub_module,
            ...permState[row.sub_module],
        }));

    const onSubmit = (data: FormData) => {
        const payload: AccessProfileCreate = {
            name: data.name,
            description: data.description || undefined,
            is_active: data.is_active,
            allows_loja: data.allows_loja,
            allows_galpon: data.allows_galpon,
            permissions: buildPermissions(),
            store_ids: Array.from(selectedStoreIds),
        };

        if (isEdit && profile) {
            updateMutation.mutate(
                { id: profile.id, data: payload },
                { onSuccess: () => onOpenChange(false) }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-full flex flex-col max-h-[90vh] p-0 gap-0">
                <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
                    <DialogTitle>{isEdit ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                    <Tabs defaultValue="geral" className="flex flex-col flex-1 min-h-0">
                        <TabsList className="mx-6 mt-4 w-auto justify-start shrink-0">
                            <TabsTrigger value="geral">Geral</TabsTrigger>
                            <TabsTrigger value="permissions">Permissoes</TabsTrigger>
                            <TabsTrigger value="stores">Lojas</TabsTrigger>
                        </TabsList>

                        {/* Tab: Geral */}
                        <TabsContent value="geral" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="ap-name" className="text-sm font-medium">
                                    Nome <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="ap-name"
                                    {...register('name')}
                                    placeholder="Ex: Operador de Conferência"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="ap-desc" className="text-sm font-medium">Descrição</label>
                                <Textarea
                                    id="ap-desc"
                                    {...register('description')}
                                    placeholder="Descreva o propósito deste perfil..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium">Ativo</p>
                                        <p className="text-xs text-muted-foreground">Perfil disponível para atribuição</p>
                                    </div>
                                    <Switch
                                        checked={watch('is_active')}
                                        onCheckedChange={(v) => setValue('is_active', v)}
                                    />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium">Permite Loja</p>
                                        <p className="text-xs text-muted-foreground">Acessa ordens de serviço de loja</p>
                                    </div>
                                    <Switch
                                        checked={watch('allows_loja')}
                                        onCheckedChange={(v) => setValue('allows_loja', v)}
                                    />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium">Permite Galpão</p>
                                        <p className="text-xs text-muted-foreground">Acessa ordens de serviço de galpão</p>
                                    </div>
                                    <Switch
                                        checked={watch('allows_galpon')}
                                        onCheckedChange={(v) => setValue('allows_galpon', v)}
                                    />
                                </label>
                            </div>
                        </TabsContent>

                        {/* Tab: Permissões */}
                        <TabsContent value="permissions" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <PermissionsSection
                                title="Administração"
                                rows={ADM_PERMISSIONS}
                                permState={permState}
                                onSetPerm={setPerm}
                            />
                            <PermissionsSection
                                title="Operacional"
                                rows={OPERACIONAL_PERMISSIONS}
                                permState={permState}
                                onSetPerm={setPerm}
                            />
                        </TabsContent>

                        {/* Tab: Lojas */}
                        <TabsContent value="stores" className="flex-1 overflow-y-auto px-6 py-4">
                            {storesLoading ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-9 w-full" />
                                    ))}
                                </div>
                            ) : stores.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma loja cadastrada.</p>
                            ) : (
                                <div className="border rounded-lg divide-y">
                                    {stores.map((store) => (
                                        <label
                                            key={store.id}
                                            htmlFor={`ap-store-${store.id}`}
                                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                                        >
                                            <Checkbox
                                                id={`ap-store-${store.id}`}
                                                checked={selectedStoreIds.has(store.id.toString())}
                                                onCheckedChange={() => toggleStore(store.id.toString())}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{store.name}</p>
                                                {store.code && (
                                                    <p className="text-xs text-muted-foreground">{store.code}</p>
                                                )}
                                            </div>
                                            {store.brand && (
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {store.brand.name}
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Perfil'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ------ Permissions Section Sub-Component ------

interface PermissionsSectionProps {
    title: string;
    rows: PermissionRow[];
    permState: PermState;
    onSetPerm: (sub_module: SubModule, field: 'can_view' | 'can_edit' | 'can_delete', value: boolean) => void;
}

function PermissionsSection({ title, rows, permState, onSetPerm }: PermissionsSectionProps) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                {title}
            </p>
            <div className="border rounded-lg overflow-hidden">
                {/* Header row */}
                <div className="flex items-center px-4 py-2 bg-muted/50 border-b">
                    <span className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Módulo
                    </span>
                    <div className="flex items-center gap-6 shrink-0">
                        <span className="w-14 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Ver
                        </span>
                        <span className="w-14 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Editar
                        </span>
                        <span className="w-14 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Deletar
                        </span>
                    </div>
                </div>

                {/* Module rows */}
                <div className="divide-y">
                    {rows.map((row) => {
                        const perm = permState[row.sub_module];
                        return (
                            <div
                                key={row.sub_module}
                                className="flex items-center px-4 py-2.5 hover:bg-muted/30 transition-colors"
                            >
                                <span className="flex-1 text-sm">{row.label}</span>
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="w-14 flex justify-center">
                                        <Checkbox
                                            checked={perm.can_view}
                                            onCheckedChange={(v) =>
                                                onSetPerm(row.sub_module, 'can_view', Boolean(v))
                                            }
                                            aria-label={`Ver ${row.label}`}
                                        />
                                    </div>
                                    <div className="w-14 flex justify-center">
                                        <Checkbox
                                            checked={perm.can_edit}
                                            onCheckedChange={(v) =>
                                                onSetPerm(row.sub_module, 'can_edit', Boolean(v))
                                            }
                                            aria-label={`Editar ${row.label}`}
                                        />
                                    </div>
                                    <div className="w-14 flex justify-center">
                                        <Checkbox
                                            checked={perm.can_delete}
                                            onCheckedChange={(v) =>
                                                onSetPerm(row.sub_module, 'can_delete', Boolean(v))
                                            }
                                            aria-label={`Deletar ${row.label}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Ensure unused import is used (SUB_MODULE_LABELS exported for potential use in other components)
export { SUB_MODULE_LABELS };
