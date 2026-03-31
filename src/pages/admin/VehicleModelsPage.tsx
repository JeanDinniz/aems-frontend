import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, PowerOff, Power, Loader2, Car } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-[#111111] dark:text-white text-2xl font-bold flex items-center gap-2"
                        style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                    >
                        <Car className="h-6 w-6" style={{ color: '#F5A800' }} />
                        Modelos de Veículos
                    </h1>
                    <p className="text-[#666666] dark:text-zinc-400 text-sm">
                        Modelos disponíveis por loja para seleção nas ordens de serviço.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setForm(INITIAL_FORM);
                        setAddDialogOpen(true);
                    }}
                    disabled={!resolvedStoreId}
                    className="font-semibold"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
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
                    <TabsList className="flex flex-wrap h-auto gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                        {stores.map((store) => (
                            <TabsTrigger
                                key={store.id}
                                value={String(store.id)}
                                className="text-[#666666] dark:text-zinc-400 data-[state=active]:bg-[#F5A800] data-[state=active]:text-[#1A1A1A] data-[state=active]:font-semibold rounded"
                            >
                                {store.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {stores.map((store) => (
                        <TabsContent key={store.id} value={String(store.id)} className="mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#999999] dark:text-zinc-400" />
                                </div>
                            ) : !models?.length ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2">
                                    <Car className="h-10 w-10 text-[#999999]/40 dark:text-zinc-400/40" />
                                    <p className="text-sm text-[#666666] dark:text-zinc-500">Nenhum modelo cadastrado para esta loja.</p>
                                </div>
                            ) : (
                                <div className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden">
                                    <div className="divide-y divide-[#E8E8E8] dark:divide-[#333333]">
                                        {models.map((model) => (
                                            <div
                                                key={model.id}
                                                className="flex items-center gap-3 px-4 py-2.5 border-t border-[#E8E8E8] dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors first:border-t-0"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium text-[#111111] dark:text-zinc-200">{model.name}</span>
                                                    {model.brand && (
                                                        <span className="ml-2 text-xs text-[#666666] dark:text-zinc-400">
                                                            {model.brand}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {model.is_active ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700/50">
                                                            Ativo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-[#666666] dark:text-zinc-400 border border-[#D1D1D1] dark:border-zinc-700">
                                                            Inativo
                                                        </span>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded"
                                                        onClick={() => handleEdit(model)}
                                                        aria-label="Editar modelo"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {model.is_active ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-[#666666] dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                            onClick={() => setConfirmDeactivateId(model.id)}
                                                            aria-label="Desativar modelo"
                                                        >
                                                            <PowerOff className="h-3.5 w-3.5" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-[#666666] dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
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
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <DialogHeader>
                        <DialogTitle className="text-[#111111] dark:text-white">Novo Modelo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="model-name" className="text-[#666666] dark:text-zinc-300">Nome do Modelo *</Label>
                            <Input
                                id="model-name"
                                placeholder="Ex: Toyota Corolla"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="model-brand" className="text-[#666666] dark:text-zinc-300">Marca</Label>
                            <Input
                                id="model-brand"
                                placeholder="Ex: Toyota"
                                value={form.brand}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setAddDialogOpen(false);
                                setForm(INITIAL_FORM);
                            }}
                            className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                            className="font-semibold"
                            style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                        >
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
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <DialogHeader>
                        <DialogTitle className="text-[#111111] dark:text-white">Editar Modelo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-model-name" className="text-[#666666] dark:text-zinc-300">Nome do Modelo *</Label>
                            <Input
                                id="edit-model-name"
                                placeholder="Ex: Toyota Corolla"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-model-brand" className="text-[#666666] dark:text-zinc-300">Marca</Label>
                            <Input
                                id="edit-model-brand"
                                placeholder="Ex: Toyota"
                                value={form.brand}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setEditingModel(null);
                                setForm(INITIAL_FORM);
                            }}
                            className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={updateMutation.isPending}
                            className="font-semibold"
                            style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                        >
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
                <AlertDialogContent className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#111111] dark:text-white">Desativar Modelo</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#666666] dark:text-zinc-400">
                            Tem certeza que deseja desativar{' '}
                            <span className="font-medium text-[#111111] dark:text-zinc-200">
                                {models?.find((m) => m.id === confirmDeactivateId)?.name ?? 'este modelo'}
                            </span>
                            ? Ele não aparecerá mais na criação de ordens de serviço.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent">
                            Cancelar
                        </AlertDialogCancel>
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
