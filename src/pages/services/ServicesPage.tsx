import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Loader2, PackageSearch } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DEPARTMENTS } from '@/constants/service-orders';

const BRAND_LABELS: Record<string, string> = {
    byd: 'BYD',
    fiat: 'FIAT',
    hyundai: 'HYUNDAI',
    toyota: 'TOYOTA',
};

const CATEGORY_LABELS: Record<string, string> = {
    vn: 'VN',
    vu: 'VU',
    workshop: 'Oficina',
    bodywork: 'Funilaria',
    film: 'Película',
    ppf: 'PPF',
};

interface AddServiceForm {
    name: string;
    code: string;
    category: string;
    brand: string;
    department: string;
    base_price: string;
}

const INITIAL_FORM: AddServiceForm = {
    name: '',
    code: '',
    category: '',
    brand: 'byd',
    department: 'film',
    base_price: '',
};

export default function ServicesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeBrand, setActiveBrand] = useState<string>('byd');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<AddServiceForm>(INITIAL_FORM);

    // Carrega todos os serviços de uma vez (400+ itens, muito leve)
    const { data: allServices, isLoading } = useQuery({
        queryKey: ['services', 'management'],
        queryFn: async () => {
            const result = await servicesService.list({ limit: 600 });
            return result.items;
        },
        staleTime: 1000 * 60 * 2,
    });

    // Filtra por marca ativa e agrupa por categoria
    const brandServices = useMemo(
        () => allServices?.filter((s) => s.brand === activeBrand) ?? [],
        [allServices, activeBrand]
    );

    const groupedByCategory = useMemo(() => {
        const groups: Record<string, ServiceItem[]> = {};
        for (const svc of brandServices) {
            const cat = svc.category ?? 'estetica';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(svc);
        }
        return Object.entries(groups).sort(([a], [b]) =>
            (CATEGORY_LABELS[a] ?? a).localeCompare(CATEGORY_LABELS[b] ?? b)
        );
    }, [brandServices]);

    // Contagem por marca para os badges
    const brandCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const brand of Object.keys(BRAND_LABELS)) {
            counts[brand] = allServices?.filter((s) => s.brand === brand).length ?? 0;
        }
        return counts;
    }, [allServices]);

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
                brand: form.brand || null,
                code: form.code.trim() || null,
                category: form.category || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setEditingService(null);
            setForm(INITIAL_FORM);
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
                brand: form.brand || null,
                code: form.code.trim() || null,
                category: form.category || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setAddDialogOpen(false);
            setForm(INITIAL_FORM);
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
        setForm({
            name: svc.name,
            code: svc.code ?? '',
            category: svc.category ?? '',
            brand: svc.brand ?? 'byd',
            department: svc.department,
            base_price: String(svc.base_price),
        });
    };

    const handleUpdate = () => {
        if (!form.name.trim()) {
            toast({ variant: 'destructive', title: 'Nome é obrigatório.' });
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
        if (!form.base_price || isNaN(parseFloat(form.base_price))) {
            toast({ variant: 'destructive', title: 'Preço base é obrigatório.' });
            return;
        }
        createMutation.mutate();
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
                        <PackageSearch className="h-6 w-6" style={{ color: '#F5A800' }} />
                        Serviços
                    </h1>
                    <p className="text-[#666666] dark:text-zinc-400 text-sm">
                        Catálogo de serviços por concessionária.
                        {allServices?.length ? ` ${allServices.length} serviços cadastrados.` : ''}
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setForm({ ...INITIAL_FORM, brand: activeBrand });
                        setAddDialogOpen(true);
                    }}
                    className="font-semibold"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Serviço
                </Button>
            </div>

            {/* Tabs por Marca */}
            <Tabs value={activeBrand} onValueChange={setActiveBrand}>
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                    {Object.entries(BRAND_LABELS).map(([key, label]) => (
                        <TabsTrigger
                            key={key}
                            value={key}
                            className="group gap-2 text-[#666666] dark:text-zinc-400 data-[state=active]:bg-[#F5A800] data-[state=active]:text-[#111111] data-[state=active]:font-semibold rounded"
                        >
                            {label}
                            {(brandCounts[key] ?? 0) > 0 && (
                                <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full text-xs font-normal bg-gray-200 dark:bg-zinc-700 text-[#444444] dark:text-zinc-300 group-data-[state=active]:bg-black/20 group-data-[state=active]:text-[#111111]">
                                    {brandCounts[key]}
                                </span>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {Object.keys(BRAND_LABELS).map((brand) => (
                    <TabsContent key={brand} value={brand} className="mt-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-6 w-6 animate-spin text-[#999999] dark:text-zinc-400" />
                            </div>
                        ) : !groupedByCategory.length ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                                <PackageSearch className="h-10 w-10 text-[#CCCCCC] dark:text-zinc-400/40" />
                                <p className="text-sm text-[#999999] dark:text-zinc-500">
                                    Nenhum serviço cadastrado para {BRAND_LABELS[brand]}.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {groupedByCategory.map(([cat, catServices]) => (
                                    <div key={cat} className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden">
                                        <div className="bg-gray-100 dark:bg-zinc-800/60 px-4 py-2.5 flex items-center gap-2 border-b border-[#D1D1D1] dark:border-[#333333]">
                                            <h3 className="font-semibold text-sm text-[#111111] dark:text-zinc-200">
                                                {CATEGORY_LABELS[cat] ?? cat}
                                            </h3>
                                            <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full text-xs border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-400 bg-transparent">
                                                {catServices.length}
                                            </span>
                                        </div>
                                        <div className="divide-y divide-[#E8E8E8] dark:divide-[#333333]">
                                            {catServices.map((svc) => (
                                                <div
                                                    key={svc.id}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm text-[#111111] dark:text-zinc-200">{svc.name}</span>
                                                        {svc.code && (
                                                            <span className="ml-2 text-xs text-[#666666] dark:text-zinc-400">
                                                                [{svc.code}]
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded"
                                                            onClick={() => handleEdit(svc)}
                                                            aria-label="Editar serviço"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                                                            onClick={() => setConfirmDeleteId(svc.id)}
                                                            aria-label="Remover serviço"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Dialog: Adicionar Serviço */}
            <Dialog
                open={addDialogOpen}
                onOpenChange={(open) => {
                    setAddDialogOpen(open);
                    if (!open) setForm(INITIAL_FORM);
                }}
            >
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <DialogHeader>
                        <DialogTitle className="text-[#111111] dark:text-white">Novo Serviço</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="svc-name" className="text-[#666666] dark:text-zinc-300">Nome do Serviço *</Label>
                            <Input
                                id="svc-name"
                                placeholder="Ex: Lavagem Simples"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="svc-code" className="text-[#666666] dark:text-zinc-300">Código</Label>
                                <Input
                                    id="svc-code"
                                    placeholder="Ex: LAV-001"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="svc-price" className="text-[#666666] dark:text-zinc-300">Preço Base (R$) *</Label>
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
                            <div className="space-y-1.5">
                                <Label className="text-[#666666] dark:text-zinc-300">Marca</Label>
                                <Select
                                    value={form.brand}
                                    onValueChange={(v) => setForm({ ...form, brand: v })}
                                >
                                    <SelectTrigger className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                        {Object.entries(BRAND_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k} className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[#666666] dark:text-zinc-300">Departamento</Label>
                                <Select
                                    value={form.department}
                                    onValueChange={(v) => setForm({ ...form, department: v })}
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
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[#666666] dark:text-zinc-300">Categoria</Label>
                                <Select
                                    value={form.category}
                                    onValueChange={(v) => setForm({ ...form, category: v })}
                                >
                                    <SelectTrigger className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k} className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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

            {/* Dialog: Editar Serviço */}
            <Dialog
                open={editingService !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingService(null);
                        setForm(INITIAL_FORM);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <DialogHeader>
                        <DialogTitle className="text-[#111111] dark:text-white">Editar Serviço</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="edit-svc-name" className="text-[#666666] dark:text-zinc-300">Nome do Serviço *</Label>
                            <Input
                                id="edit-svc-name"
                                placeholder="Ex: Lavagem Simples"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-svc-code" className="text-[#666666] dark:text-zinc-300">Código</Label>
                                <Input
                                    id="edit-svc-code"
                                    placeholder="Ex: LAV-001"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-svc-price" className="text-[#666666] dark:text-zinc-300">Preço Base (R$) *</Label>
                                <Input
                                    id="edit-svc-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={form.base_price}
                                    onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                                    className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[#666666] dark:text-zinc-300">Marca</Label>
                                <Select
                                    value={form.brand}
                                    onValueChange={(v) => setForm({ ...form, brand: v })}
                                >
                                    <SelectTrigger className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                        {Object.entries(BRAND_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k} className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[#666666] dark:text-zinc-300">Departamento</Label>
                                <Select
                                    value={form.department}
                                    onValueChange={(v) => setForm({ ...form, department: v })}
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
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[#666666] dark:text-zinc-300">Categoria</Label>
                                <Select
                                    value={form.category}
                                    onValueChange={(v) => setForm({ ...form, category: v })}
                                >
                                    <SelectTrigger className="bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k} className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setEditingService(null);
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

            {/* Dialog: Confirmar Remoção */}
            <AlertDialog
                open={confirmDeleteId !== null}
                onOpenChange={(open) => !open && setConfirmDeleteId(null)}
            >
                <AlertDialogContent className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#111111] dark:text-white">Remover Serviço</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#666666] dark:text-zinc-400">
                            Tem certeza que deseja remover{' '}
                            <span className="font-medium text-[#111111] dark:text-zinc-200">
                                {allServices?.find((s) => s.id === confirmDeleteId)?.name ?? 'este serviço'}
                            </span>
                            ? Ele não aparecerá mais nas ordens de serviço.
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
