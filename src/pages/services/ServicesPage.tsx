import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Loader2, PackageSearch } from 'lucide-react';
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
import { servicesService } from '@/services/api/services.service';
import type { ServiceItem } from '@/services/api/services.service';
import brandsService from '@/services/api/brands.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DEPARTMENTS } from '@/constants/service-orders';

interface AddServiceForm {
    name: string;
    code: string;
    brand_id: string;
    department: string;
    base_price: string;
}

interface ServiceFormFieldsProps {
    form: AddServiceForm;
    setForm: (form: AddServiceForm) => void;
    brands: { id: number; name: string }[];
    codeDuplicateWarning: boolean;
    setCodeDuplicateWarning: (v: boolean) => void;
    checkCodeDuplicate: (code: string) => void;
    editingService: ServiceItem | null;
}

function ServiceFormFields({
    form,
    setForm,
    brands,
    codeDuplicateWarning,
    setCodeDuplicateWarning,
    checkCodeDuplicate,
}: ServiceFormFieldsProps) {
    return (
        <div className="space-y-4 py-2">
            {/* Ordem: Marca → Departamento → Código → Preço → Nome */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-[#666666] dark:text-zinc-300">Marca *</Label>
                    <Select
                        value={form.brand_id}
                        onValueChange={(v) => {
                            setForm({ ...form, brand_id: v });
                            setCodeDuplicateWarning(false);
                        }}
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
                    <Label className="text-[#666666] dark:text-zinc-300">Departamento</Label>
                    <Select
                        value={form.department}
                        onValueChange={(v) => {
                            setForm({ ...form, department: v });
                            setCodeDuplicateWarning(false);
                        }}
                    >
                        <SelectTrigger className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                            {DEPARTMENTS.map((d) => (
                                <SelectItem key={d.value} value={d.value} className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                    {d.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="svc-code" className="text-[#666666] dark:text-zinc-300">Código</Label>
                    <Input
                        id="svc-code"
                        placeholder="Ex: LAV-001"
                        value={form.code}
                        onChange={(e) => {
                            setForm({ ...form, code: e.target.value });
                            setCodeDuplicateWarning(false);
                        }}
                        onBlur={(e) => checkCodeDuplicate(e.target.value)}
                        className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                    />
                    {codeDuplicateWarning && (
                        <p className="text-xs text-red-500">Ja existe um servico com este codigo para esta marca e departamento.</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="svc-price" className="text-[#666666] dark:text-zinc-300">Preco Base (R$) *</Label>
                    <Input
                        id="svc-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.base_price}
                        onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                        className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="svc-name" className="text-[#666666] dark:text-zinc-300">Nome do Servico *</Label>
                <Input
                    id="svc-name"
                    placeholder="Ex: Lavagem Simples"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                />
            </div>
        </div>
    );
}

const INITIAL_FORM: AddServiceForm = {
    name: '',
    code: '',
    brand_id: '',
    department: 'film',
    base_price: '',
};

export default function ServicesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeBrandId, setActiveBrandId] = useState<number | null>(null);
    const [activeDept, setActiveDept] = useState<string>('all');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<AddServiceForm>(INITIAL_FORM);
    const [codeDuplicateWarning, setCodeDuplicateWarning] = useState(false);

    // Load brands from API
    const { data: brandsData, isLoading: brandsLoading } = useQuery({
        queryKey: ['brands', 'active'],
        queryFn: () => brandsService.list({ is_active: true }),
        staleTime: 1000 * 60 * 5,
    });

    const brands = brandsData?.items ?? [];
    const resolvedBrandId = activeBrandId; // null = Todos

    // Load all services at once
    const { data: allServices, isLoading: servicesLoading } = useQuery({
        queryKey: ['services', 'management'],
        queryFn: async () => {
            const result = await servicesService.list({ limit: 600 });
            return result.items;
        },
        staleTime: 1000 * 60 * 2,
    });

    const isLoading = brandsLoading || servicesLoading;

    // Filter by active brand and/or department
    const brandServices = useMemo(() => {
        let filtered = allServices ?? [];
        if (resolvedBrandId !== null) {
            filtered = filtered.filter((s) => s.brand_id === resolvedBrandId);
        }
        if (activeDept !== 'all') {
            filtered = filtered.filter((s) => s.department === activeDept);
        }
        return filtered;
    }, [allServices, resolvedBrandId, activeDept]);

    // Count per brand for badges
    const brandCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const brand of brands) {
            counts[brand.id] = allServices?.filter((s) => s.brand_id === brand.id).length ?? 0;
        }
        return counts;
    }, [allServices, brands]);

    // Duplicate code check on blur
    const checkCodeDuplicate = (code: string) => {
        if (!code.trim() || !form.brand_id || !form.department) {
            setCodeDuplicateWarning(false);
            return;
        }
        const brandIdNum = Number(form.brand_id);
        const exists = (allServices ?? []).some(
            (s) =>
                s.code?.toLowerCase() === code.toLowerCase() &&
                s.brand_id === brandIdNum &&
                s.department === form.department &&
                s.id !== editingService?.id
        );
        setCodeDuplicateWarning(exists);
    };

    const deactivateMutation = useMutation({
        mutationFn: (id: number) => servicesService.deactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setConfirmDeleteId(null);
            toast({ title: 'Serviço removido com sucesso.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao remover serviço.' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: () => {
            if (!editingService) throw new Error('No service selected');
            return servicesService.update(editingService.id, {
                name: form.name.trim(),
                department: form.department,
                base_price: parseFloat(form.base_price) || 0,
                brand_id: Number(form.brand_id),
                code: form.code.trim() || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setEditingService(null);
            setForm(INITIAL_FORM);
            setCodeDuplicateWarning(false);
            toast({ title: 'Serviço atualizado com sucesso.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao atualizar serviço.' });
        },
    });

    const createMutation = useMutation({
        mutationFn: () =>
            servicesService.create({
                name: form.name.trim(),
                department: form.department,
                base_price: parseFloat(form.base_price) || 0,
                brand_id: Number(form.brand_id),
                code: form.code.trim() || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setAddDialogOpen(false);
            setForm(INITIAL_FORM);
            setCodeDuplicateWarning(false);
            toast({ title: 'Serviço adicionado com sucesso.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao adicionar serviço.' });
        },
    });

    if (user?.role !== 'owner') {
        return <Navigate to="/" replace />;
    }

    const handleEdit = (svc: ServiceItem) => {
        setEditingService(svc);
        setCodeDuplicateWarning(false);
        setForm({
            name: svc.name,
            code: svc.code ?? '',
            brand_id: String(svc.brand_id),
            department: svc.department,
            base_price: String(svc.base_price),
        });
    };

    const handleUpdate = () => {
        if (!form.name.trim()) {
            toast({ variant: 'destructive', title: 'Nome é obrigatório.' });
            return;
        }
        if (!form.brand_id) {
            toast({ variant: 'destructive', title: 'Marca é obrigatória.' });
            return;
        }
        if (!form.base_price || isNaN(parseFloat(form.base_price))) {
            toast({ variant: 'destructive', title: 'Preço base é obrigatório.' });
            return;
        }
        updateMutation.mutate();
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
        if (!form.base_price || isNaN(parseFloat(form.base_price))) {
            toast({ variant: 'destructive', title: 'Preço base é obrigatório.' });
            return;
        }
        createMutation.mutate();
    };

    const deptLabel = (key: string) =>
        DEPARTMENTS.find((d) => d.value === key)?.label ?? key;

    const formFieldsProps: ServiceFormFieldsProps = {
        form,
        setForm,
        brands,
        codeDuplicateWarning,
        setCodeDuplicateWarning,
        checkCodeDuplicate,
        editingService,
    };

    return (
        <div className="p-6 space-y-6">
            {/* Cabecalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-[#111111] dark:text-white text-2xl font-bold flex items-center gap-2"
                        style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                    >
                        <PackageSearch className="h-6 w-6" style={{ color: '#F5A800' }} />
                        Servicos
                    </h1>
                    <p className="text-[#666666] dark:text-zinc-400 text-sm">
                        Catalogo de servicos por concessionaria.
                        {allServices?.length ? ` ${allServices.length} servicos cadastrados.` : ''}
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setForm({
                            ...INITIAL_FORM,
                            brand_id: resolvedBrandId !== null ? String(resolvedBrandId) : '',
                        });
                        setCodeDuplicateWarning(false);
                        setAddDialogOpen(true);
                    }}
                    className="font-semibold"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Servico
                </Button>
            </div>

            {/* Filtros */}
            {brands.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Select
                            value={resolvedBrandId !== null ? String(resolvedBrandId) : 'all'}
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
                                        {brand.name}{(brandCounts[brand.id] ?? 0) > 0 ? ` (${brandCounts[brand.id]})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={activeDept}
                            onValueChange={setActiveDept}
                        >
                            <SelectTrigger className="w-[200px] bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                <SelectValue placeholder="Departamento" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                <SelectItem value="all" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                    Todos
                                </SelectItem>
                                {DEPARTMENTS.map((d) => (
                                    <SelectItem
                                        key={d.value}
                                        value={d.value}
                                        className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white"
                                    >
                                        {d.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-6 w-6 animate-spin text-[#999999] dark:text-zinc-400" />
                        </div>
                    ) : !brandServices.length ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                            <PackageSearch className="h-10 w-10 text-[#CCCCCC] dark:text-zinc-400/40" />
                            <p className="text-sm text-[#999999] dark:text-zinc-500">
                                Nenhum servico encontrado para os filtros selecionados.
                            </p>
                        </div>
                    ) : (
                        <div className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden">
                            {/* Header da tabela */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-x-4 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800/60 border-b border-[#D1D1D1] dark:border-[#333333]">
                                <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">Nome do Serviço</span>
                                <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">Código</span>
                                <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">Departamento</span>
                                <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">Marca</span>
                                <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">Valor</span>
                                <span className="w-16" />
                            </div>
                            {/* Linhas */}
                            <div className="divide-y divide-[#E8E8E8] dark:divide-[#333333]">
                                {brandServices.map((svc) => (
                                    <div
                                        key={svc.id}
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-x-4 items-center px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors"
                                    >
                                        <span className="text-sm text-[#111111] dark:text-zinc-200 truncate">{svc.name}</span>
                                        <span className="text-sm text-[#666666] dark:text-zinc-400 truncate">
                                            {svc.code ?? '—'}
                                        </span>
                                        <span className="text-sm text-[#666666] dark:text-zinc-400 truncate">
                                            {deptLabel(svc.department)}
                                        </span>
                                        <span className="text-sm text-[#666666] dark:text-zinc-400 truncate">
                                            {brands.find((b) => b.id === svc.brand_id)?.name ?? '—'}
                                        </span>
                                        <span className="text-sm text-[#111111] dark:text-zinc-200 font-medium">
                                            {svc.base_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0 w-16 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded"
                                                onClick={() => handleEdit(svc)}
                                                aria-label="Editar servico"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                                                onClick={() => setConfirmDeleteId(svc.id)}
                                                aria-label="Remover servico"
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

            {!brandsLoading && brands.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <PackageSearch className="h-10 w-10 text-[#CCCCCC] dark:text-zinc-400/40" />
                    <p className="text-sm text-[#999999] dark:text-zinc-500">
                        Nenhuma marca cadastrada. Cadastre marcas primeiro.
                    </p>
                </div>
            )}

            {/* Dialog: Adicionar Servico */}
            <Dialog
                open={addDialogOpen}
                onOpenChange={(open) => {
                    setAddDialogOpen(open);
                    if (!open) {
                        setForm(INITIAL_FORM);
                        setCodeDuplicateWarning(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <DialogHeader>
                        <DialogTitle className="text-[#111111] dark:text-white">Novo Servico</DialogTitle>
                    </DialogHeader>
                    <ServiceFormFields {...formFieldsProps} />
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setAddDialogOpen(false);
                                setForm(INITIAL_FORM);
                                setCodeDuplicateWarning(false);
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

            {/* Dialog: Editar Servico */}
            <Dialog
                open={editingService !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingService(null);
                        setForm(INITIAL_FORM);
                        setCodeDuplicateWarning(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <DialogHeader>
                        <DialogTitle className="text-[#111111] dark:text-white">Editar Servico</DialogTitle>
                    </DialogHeader>
                    <ServiceFormFields {...formFieldsProps} />
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setEditingService(null);
                                setForm(INITIAL_FORM);
                                setCodeDuplicateWarning(false);
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

            {/* Dialog: Confirmar Remocao */}
            <AlertDialog
                open={confirmDeleteId !== null}
                onOpenChange={(open) => !open && setConfirmDeleteId(null)}
            >
                <AlertDialogContent className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#111111] dark:text-white">Remover Servico</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#666666] dark:text-zinc-400">
                            Tem certeza que deseja remover{' '}
                            <span className="font-medium text-[#111111] dark:text-zinc-200">
                                {allServices?.find((s) => s.id === confirmDeleteId)?.name ?? 'este servico'}
                            </span>
                            ? Ele nao aparecera mais nas ordens de servico.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                confirmDeleteId !== null &&
                                deactivateMutation.mutate(confirmDeleteId)
                            }
                            disabled={deactivateMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deactivateMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
