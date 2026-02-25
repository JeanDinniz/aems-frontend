import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, PackageSearch } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { servicesService } from '@/services/api/services.service';
import type { ServiceItem } from '@/services/api/services.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const BRAND_LABELS: Record<string, string> = {
    byd: 'BYD',
    fiat: 'FIAT',
    hyundai: 'HYUNDAI',
    toyota: 'TOYOTA',
};

const CATEGORY_LABELS: Record<string, string> = {
    lavagem: 'Lavagem',
    polimento: 'Polimento',
    polimento_peca: 'Polimento/Peça',
    higienizacao: 'Higienização',
    hidratacao: 'Hidratação',
    enceramento: 'Enceramento',
    vitrificacao: 'Vitrificação',
    cristalizacao: 'Cristalização',
    pacote_estetica: 'Pacotes Estética',
    estetica: 'Estética',
    martelinho: 'Martelinho',
    pelicula_tintada: 'Fumê',
    pelicula_poliester: 'Poliéster',
    pelicula_premium: 'Premium',
    pelicula_seguranca: 'Segurança',
    pelicula_3m: '3M',
    ppf_avulso: 'PPF Avulso',
    ppf_pacote: 'PPF Pacotes',
    vn: 'VN',
    vu: 'VU',
};

const DEPARTMENTS = [
    { value: 'aesthetics', label: 'Estética' },
    { value: 'film', label: 'Película' },
    { value: 'ppf', label: 'PPF' },
    { value: 'vn', label: 'VN' },
    { value: 'vu', label: 'VU' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'workshop', label: 'Oficina' },
];

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
    department: 'aesthetics',
    base_price: '',
};

export default function ServicesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeBrand, setActiveBrand] = useState<string>('byd');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<AddServiceForm>(INITIAL_FORM);

    if (user?.role !== 'owner') {
        return <Navigate to="/" replace />;
    }

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
        <div className="container mx-auto p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
                    <p className="text-muted-foreground">
                        Catálogo de serviços por concessionária.
                        {allServices?.length ? ` ${allServices.length} serviços cadastrados.` : ''}
                    </p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Serviço
                </Button>
            </div>

            {/* Tabs por Marca */}
            <Tabs value={activeBrand} onValueChange={setActiveBrand}>
                <TabsList className="grid w-full grid-cols-4">
                    {Object.entries(BRAND_LABELS).map(([key, label]) => (
                        <TabsTrigger key={key} value={key} className="gap-2">
                            {label}
                            {(brandCounts[key] ?? 0) > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="h-5 px-1.5 text-xs font-normal"
                                >
                                    {brandCounts[key]}
                                </Badge>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {Object.keys(BRAND_LABELS).map((brand) => (
                    <TabsContent key={brand} value={brand} className="mt-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : !groupedByCategory.length ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                                <PackageSearch className="h-10 w-10 opacity-40" />
                                <p className="text-sm">
                                    Nenhum serviço cadastrado para {BRAND_LABELS[brand]}.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {groupedByCategory.map(([cat, catServices]) => (
                                    <div key={cat} className="border rounded-lg overflow-hidden">
                                        <div className="bg-muted/60 px-4 py-2.5 flex items-center gap-2 border-b">
                                            <h3 className="font-semibold text-sm">
                                                {CATEGORY_LABELS[cat] ?? cat}
                                            </h3>
                                            <Badge variant="outline" className="text-xs h-5 px-1.5">
                                                {catServices.length}
                                            </Badge>
                                        </div>
                                        <div className="divide-y">
                                            {catServices.map((svc) => (
                                                <div
                                                    key={svc.id}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm">{svc.name}</span>
                                                        {svc.code && (
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                [{svc.code}]
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                                        onClick={() => setConfirmDeleteId(svc.id)}
                                                        aria-label="Remover serviço"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Serviço</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="svc-name">Nome do Serviço *</Label>
                            <Input
                                id="svc-name"
                                placeholder="Ex: Lavagem Simples"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="svc-code">Código</Label>
                                <Input
                                    id="svc-code"
                                    placeholder="Ex: LAV-001"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="svc-price">Preço Base (R$) *</Label>
                                <Input
                                    id="svc-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={form.base_price}
                                    onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Marca</Label>
                                <Select
                                    value={form.brand}
                                    onValueChange={(v) => setForm({ ...form, brand: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(BRAND_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Departamento</Label>
                                <Select
                                    value={form.department}
                                    onValueChange={(v) => setForm({ ...form, department: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTMENTS.map((d) => (
                                            <SelectItem key={d.value} value={d.value}>
                                                {d.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Categoria</Label>
                                <Select
                                    value={form.category}
                                    onValueChange={(v) => setForm({ ...form, category: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
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

            {/* Dialog: Confirmar Remoção */}
            <Dialog
                open={confirmDeleteId !== null}
                onOpenChange={(open) => !open && setConfirmDeleteId(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remover Serviço</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Tem certeza que deseja remover este serviço? Ele não aparecerá mais nas
                        ordens de serviço.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                confirmDeleteId !== null &&
                                deactivateMutation.mutate(confirmDeleteId)
                            }
                            disabled={deactivateMutation.isPending}
                        >
                            {deactivateMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Remover
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
