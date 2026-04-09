import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, PowerOff, Power, Loader2, Car, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import brandsService from '@/services/api/brands.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ModelForm {
    name: string;
    brand_id: string;
}

const INITIAL_FORM: ModelForm = { name: '', brand_id: '' };

export function VehicleModelsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeBrandId, setActiveBrandId] = useState<number | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<VehicleModelItem | null>(null);
    const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null);
    const [confirmHardDeleteId, setConfirmHardDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<ModelForm>(INITIAL_FORM);

    const { data: brandsData, isLoading: brandsLoading } = useQuery({
        queryKey: ['brands', 'management'],
        queryFn: () => brandsService.list(),
        staleTime: 1000 * 60 * 5,
    });

    const brands = brandsData?.items ?? [];

    const { data: models, isLoading: modelsLoading } = useQuery({
        queryKey: ['vehicle-models', 'management', activeBrandId, brands.map((b) => b.id)],
        queryFn: async () => {
            if (activeBrandId !== null) {
                return vehicleModelsService.list({ brand_id: activeBrandId, active_only: false });
            }
            // "Todos": busca modelos de cada marca em paralelo e combina
            const results = await Promise.all(
                brands.map((b) => vehicleModelsService.list({ brand_id: b.id, active_only: false }))
            );
            return results.flat();
        },
        enabled: brands.length > 0,
        staleTime: 1000 * 60 * 2,
    });

    const createMutation = useMutation({
        mutationFn: () => {
            const brandId = Number(form.brand_id);
            if (!brandId) throw new Error('Nenhuma marca selecionada');
            return vehicleModelsService.create(brandId, { name: form.name.trim() });
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
            if (!editingModel) throw new Error('Dados inválidos');
            return vehicleModelsService.update(editingModel.id, editingModel.brand_id, {
                name: form.name.trim(),
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
            const model = models?.find((m) => m.id === id);
            if (!model) throw new Error('Modelo não encontrado');
            return vehicleModelsService.deactivate(id, model.brand_id);
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
            const model = models?.find((m) => m.id === id);
            if (!model) throw new Error('Modelo não encontrado');
            return vehicleModelsService.update(id, model.brand_id, { is_active: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            toast({ title: 'Modelo reativado com sucesso.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao reativar modelo.' });
        },
    });

    const hardDeleteMutation = useMutation({
        mutationFn: (id: number) => {
            const model = models?.find((m) => m.id === id);
            if (!model) throw new Error('Modelo não encontrado');
            return vehicleModelsService.hardDelete(id, model.brand_id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-models'] });
            setConfirmHardDeleteId(null);
            toast({ title: 'Modelo excluído permanentemente.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Não foi possível excluir. Verifique se há O.S. vinculadas.' });
        },
    });

    if (user?.role !== 'owner') {
        return <Navigate to="/" replace />;
    }

    const handleEdit = (model: VehicleModelItem) => {
        setEditingModel(model);
        setForm({ name: model.name, brand_id: String(model.brand_id) });
    };

    const handleCreate = () => {
        if (!form.name.trim()) {
            toast({ variant: 'destructive', title: 'Nome é obrigatório.' });
            return;
        }
        if (!form.brand_id) {
            toast({ variant: 'destructive', title: 'Marca é obrigatória.' });
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

    const isLoading = brandsLoading || modelsLoading;

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
                        Modelos disponíveis por marca para seleção nas ordens de serviço.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setForm(INITIAL_FORM);
                        setAddDialogOpen(true);
                    }}
                    className="font-semibold"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Modelo
                </Button>
            </div>

            {!brandsLoading && brands.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Car className="h-10 w-10 text-[#999999]/40 dark:text-zinc-400/40" />
                    <p className="text-sm text-[#666666] dark:text-zinc-500">Nenhuma marca cadastrada. Cadastre marcas primeiro.</p>
                </div>
            ) : (
                /* Filtro de Marca */
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Select
                            value={activeBrandId !== null ? String(activeBrandId) : 'all'}
                            onValueChange={(v) => setActiveBrandId(v === 'all' ? null : Number(v))}
                        >
                            <SelectTrigger className="w-[200px] bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                <SelectValue placeholder="Marca" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                <SelectItem value="all" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                    Todos
                                </SelectItem>
                                {brands.map((brand) => (
                                    <SelectItem
                                        key={brand.id}
                                        value={String(brand.id)}
                                        className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white"
                                    >
                                        {brand.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-6 w-6 animate-spin text-[#999999] dark:text-zinc-400" />
                        </div>
                    ) : !models?.length ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                            <Car className="h-10 w-10 text-[#999999]/40 dark:text-zinc-400/40" />
                            <p className="text-sm text-[#666666] dark:text-zinc-500">
                                Nenhum modelo encontrado para os filtros selecionados.
                            </p>
                        </div>
                    ) : (
                        <div className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden">
                            {/* Header da tabela */}
                            <div className="grid grid-cols-[2fr_1fr_auto_auto] gap-x-4 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800/60 border-b border-[#D1D1D1] dark:border-[#333333]">
                                <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">Nome do Modelo</span>
                                <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">Marca</span>
                                <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">Status</span>
                                <span className="w-24" />
                            </div>
                            <div className="divide-y divide-[#E8E8E8] dark:divide-[#333333]">
                                {models.map((model) => (
                                    <div
                                        key={model.id}
                                        className="grid grid-cols-[2fr_1fr_auto_auto] gap-x-4 items-center px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors"
                                    >
                                        <span className="text-sm font-medium text-[#111111] dark:text-zinc-200">{model.name}</span>
                                        <span className="text-sm text-[#666666] dark:text-zinc-400">
                                            {model.brand?.name ?? brands.find((b) => b.id === model.brand_id)?.name ?? '—'}
                                        </span>
                                        <div>
                                            {model.is_active ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700/50">
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-[#666666] dark:text-zinc-400 border border-[#D1D1D1] dark:border-zinc-700">
                                                    Inativo
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 w-24 justify-end">
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-[#666666] dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                onClick={() => setConfirmHardDeleteId(model.id)}
                                                aria-label="Excluir modelo permanentemente"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
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
                            <Label className="text-[#666666] dark:text-zinc-300">Marca *</Label>
                            <Select
                                value={form.brand_id}
                                onValueChange={(v) => setForm({ ...form, brand_id: v })}
                            >
                                <SelectTrigger className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                    <SelectValue placeholder="Selecione a marca" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                    {brands.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)} className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="model-name" className="text-[#666666] dark:text-zinc-300">Nome do Modelo *</Label>
                            <Input
                                id="model-name"
                                placeholder="Ex: Corolla"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                                placeholder="Ex: Corolla"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
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

            {/* AlertDialog: Confirmar Exclusão Permanente */}
            <AlertDialog
                open={confirmHardDeleteId !== null}
                onOpenChange={(open) => !open && setConfirmHardDeleteId(null)}
            >
                <AlertDialogContent className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#111111] dark:text-white">Excluir Modelo Permanentemente</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#666666] dark:text-zinc-400">
                            Esta ação é <span className="font-semibold text-red-600">irreversível</span>. O modelo{' '}
                            <span className="font-medium text-[#111111] dark:text-zinc-200">
                                {models?.find((m) => m.id === confirmHardDeleteId)?.name ?? ''}
                            </span>{' '}
                            será excluído permanentemente. Só é possível excluir modelos sem ordens de serviço vinculadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmHardDeleteId !== null && hardDeleteMutation.mutate(confirmHardDeleteId)}
                            disabled={hardDeleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {hardDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Excluir Permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
