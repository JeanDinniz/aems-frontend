import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, PowerOff, Power, Loader2, Car } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { vehicleModelsService } from '@/services/api/vehicle-models.service';
import type { VehicleModelItem } from '@/services/api/vehicle-models.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStores } from '@/hooks/useStores';

interface ModelForm {
    name: string;
    brand: string;
}

const INITIAL_FORM: ModelForm = { name: '', brand: '' };

export function VehicleModelsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { allStores } = useStores();

    const [activeStoreId, setActiveStoreId] = useState<number | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<VehicleModelItem | null>(null);
    const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null);
    const [form, setForm] = useState<ModelForm>(INITIAL_FORM);

    const stores = allStores ?? [];
    const resolvedStoreId = activeStoreId ?? stores[0]?.id ?? null;

    const { data: models, isLoading } = useQuery({
        queryKey: ['vehicle-models', 'management', resolvedStoreId],
        queryFn: () =>
            resolvedStoreId
                ? vehicleModelsService.list({ store_id: resolvedStoreId, active_only: false })
                : Promise.resolve([]),
        enabled: !!resolvedStoreId,
        staleTime: 1000 * 60 * 2,
    });

    const createMutation = useMutation({
        mutationFn: () => {
            if (!resolvedStoreId) throw new Error('Nenhuma loja selecionada');
            return vehicleModelsService.create(resolvedStoreId, {
                name: form.name.trim(),
                brand: form.brand.trim() || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            setAddDialogOpen(false);
            setForm(INITIAL_FORM);
            toast({ title: 'Modelo adicionado com sucesso.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao adicionar modelo.' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: () => {
            if (!editingModel || !resolvedStoreId) throw new Error('Dados inválidos');
            return vehicleModelsService.update(editingModel.id, resolvedStoreId, {
                name: form.name.trim(),
                brand: form.brand.trim() || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            setEditingModel(null);
            setForm(INITIAL_FORM);
            toast({ title: 'Modelo atualizado com sucesso.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao atualizar modelo.' });
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: number) => {
            if (!resolvedStoreId) throw new Error('Nenhuma loja selecionada');
            return vehicleModelsService.deactivate(id, resolvedStoreId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            setConfirmDeactivateId(null);
            toast({ title: 'Modelo desativado com sucesso.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao desativar modelo.' });
        },
    });

    const reactivateMutation = useMutation({
        mutationFn: (id: number) => {
            if (!resolvedStoreId) throw new Error('Nenhuma loja selecionada');
            return vehicleModelsService.update(id, resolvedStoreId, { is_active: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            toast({ title: 'Modelo reativado com sucesso.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao reativar modelo.' });
        },
    });

    if (user?.role !== 'owner') {
        return <Navigate to="/" replace />;
    }

    const handleEdit = (model: VehicleModelItem) => {
        setEditingModel(model);
        setForm({ name: model.name, brand: model.brand ?? '' });
    };

    const handleCreate = () => {
        if (!form.name.trim()) {
            toast({ variant: 'destructive', title: 'Nome é obrigatório.' });
            return;
        }
        createMutation.mutate();
    };

    const handleUpdate = () => {
        if (!form.name.trim()) {
            toast({ variant: 'destructive', title: 'Nome é obrigatório.' });
            return;
        }
        updateMutation.mutate();
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Modelos de Veículos</h1>
                    <p className="text-muted-foreground">
                        Modelos disponíveis por loja para seleção nas ordens de serviço.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setForm(INITIAL_FORM);
                        setAddDialogOpen(true);
                    }}
                    disabled={!resolvedStoreId}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Modelo
                </Button>
            </div>

            {/* Tabs por Loja */}
            {stores.length > 0 && (
                <Tabs
                    value={String(resolvedStoreId)}
                    onValueChange={(v) => setActiveStoreId(Number(v))}
                >
                    <TabsList className="flex flex-wrap h-auto gap-1">
                        {stores.map((store) => (
                            <TabsTrigger key={store.id} value={String(store.id)}>
                                {store.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {stores.map((store) => (
                        <TabsContent key={store.id} value={String(store.id)} className="mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : !models?.length ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                                    <Car className="h-10 w-10 opacity-40" />
                                    <p className="text-sm">Nenhum modelo cadastrado para esta loja.</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="divide-y">
                                        {models.map((model) => (
                                            <div
                                                key={model.id}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium">{model.name}</span>
                                                    {model.brand && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            {model.brand}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge
                                                        variant={model.is_active ? 'default' : 'secondary'}
                                                        className="text-xs h-5 px-1.5"
                                                    >
                                                        {model.is_active ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                        onClick={() => handleEdit(model)}
                                                        aria-label="Editar modelo"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {model.is_active ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                            onClick={() => setConfirmDeactivateId(model.id)}
                                                            aria-label="Desativar modelo"
                                                        >
                                                            <PowerOff className="h-3.5 w-3.5" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-green-600"
                                                            onClick={() => reactivateMutation.mutate(model.id)}
                                                            disabled={reactivateMutation.isPending}
                                                            aria-label="Reativar modelo"
                                                        >
                                                            <Power className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            )}

            {/* Dialog: Adicionar Modelo */}
            <Dialog
                open={addDialogOpen}
                onOpenChange={(open) => {
                    setAddDialogOpen(open);
                    if (!open) setForm(INITIAL_FORM);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Modelo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="model-name">Nome do Modelo *</Label>
                            <Input
                                id="model-name"
                                placeholder="Ex: Toyota Corolla"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="model-brand">Marca</Label>
                            <Input
                                id="model-brand"
                                placeholder="Ex: Toyota"
                                value={form.brand}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAddDialogOpen(false);
                                setForm(INITIAL_FORM);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Adicionar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Editar Modelo */}
            <Dialog
                open={editingModel !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingModel(null);
                        setForm(INITIAL_FORM);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Modelo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-model-name">Nome do Modelo *</Label>
                            <Input
                                id="edit-model-name"
                                placeholder="Ex: Toyota Corolla"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-model-brand">Marca</Label>
                            <Input
                                id="edit-model-brand"
                                placeholder="Ex: Toyota"
                                value={form.brand}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditingModel(null);
                                setForm(INITIAL_FORM);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                            {updateMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog: Confirmar Desativação */}
            <AlertDialog
                open={confirmDeactivateId !== null}
                onOpenChange={(open) => !open && setConfirmDeactivateId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desativar Modelo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja desativar{' '}
                            <span className="font-medium text-foreground">
                                {models?.find((m) => m.id === confirmDeactivateId)?.name ?? 'este modelo'}
                            </span>
                            ? Ele não aparecerá mais na criação de ordens de serviço.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                confirmDeactivateId !== null &&
                                deactivateMutation.mutate(confirmDeactivateId)
                            }
                            disabled={deactivateMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deactivateMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Desativar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
