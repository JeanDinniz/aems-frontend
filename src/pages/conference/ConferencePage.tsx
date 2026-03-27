import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrdersService } from '@/services/api/service-orders.service';
import { servicesService } from '@/services/api/services.service';
import { useAuthStore } from '@/stores/auth.store';
import { useStoreStore } from '@/stores/store.store';
import type { ServiceOrder } from '@/types/service-order.types';
import { DEPARTMENTS_MAP } from '@/constants/service-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Pencil, Search, ClipboardCheck, ImageOff } from 'lucide-react';

// Badge de departamento colorido
const DEPT_COLORS: Record<string, string> = {
    film: 'bg-purple-100 text-purple-800 border-purple-200',
    ppf: 'bg-blue-100 text-blue-800 border-blue-200',
    vn: 'bg-green-100 text-green-800 border-green-200',
    vu: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bodywork: 'bg-orange-100 text-orange-800 border-orange-200',
    workshop: 'bg-gray-100 text-gray-800 border-gray-200',
};

function DeptBadge({ dept }: { dept: string }) {
    const colors = DEPT_COLORS[dept] ?? 'bg-gray-100 text-gray-800';
    const label = DEPARTMENTS_MAP[dept as keyof typeof DEPARTMENTS_MAP] ?? dept;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
            {label}
        </span>
    );
}

// Formata data para pt-BR
function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

// Formata valor em BRL
function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Calcula valor total de uma OS com base nos itens (unit_price * quantity)
function calcTotal(order: ServiceOrder): number {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
        const price = item.unit_price ?? 0;
        const qty = item.quantity ?? 1;
        return sum + price * qty;
    }, 0);
}

// Nomes dos serviços de uma OS
function getServiceNames(order: ServiceOrder, services?: Array<{ id: number; name: string }>): string {
    if (!order.items || order.items.length === 0) return '—';
    if (!services || services.length === 0) return `${order.items.length} serviço(s)`;
    return order.items
        .map((item) => services.find((s) => s.id === item.service_id)?.name ?? `Serviço #${item.service_id}`)
        .join(', ');
}

// ─── PhotoDialog ───────────────────────────────────────────────────────────────
function PhotoDialog({ url, open, onClose }: { url: string; open: boolean; onClose: () => void }) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl p-2">
                <img src={url} alt="Foto da OS" className="w-full rounded-lg object-contain max-h-[80vh]" />
            </DialogContent>
        </Dialog>
    );
}

// ─── EditDialog ────────────────────────────────────────────────────────────────
interface EditDialogProps {
    order: ServiceOrder | null;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}

function EditDialog({ order, open, onClose, onSaved }: EditDialogProps) {
    const [externalOs, setExternalOs] = useState('');
    const [vehicleBrand, setVehicleBrand] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [serviceDate, setServiceDate] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Sincroniza estado quando a OS muda
    useEffect(() => {
        if (order) {
            setExternalOs(order.external_os_number ?? '');
            setVehicleBrand(order.vehicle_brand ?? '');
            setVehicleModel(order.vehicle_model ?? '');
            setVehicleColor(order.vehicle_color ?? '');
            setVehicleYear(order.vehicle_year != null ? String(order.vehicle_year) : '');
            setServiceDate(order.service_date ?? '');
            setInvoiceNumber(order.invoice_number ?? '');
            setNotes(order.notes ?? '');
            setInternalNotes(order.internal_notes ?? '');
        }
    }, [order?.id]);

    const handleSave = async () => {
        if (!order) return;
        setSaving(true);
        try {
            await serviceOrdersService.update(order.id, {
                external_os_number: externalOs || undefined,
                vehicle_brand: vehicleBrand || undefined,
                vehicle_model: vehicleModel || undefined,
                vehicle_color: vehicleColor || undefined,
                vehicle_year: vehicleYear ? parseInt(vehicleYear, 10) : undefined,
                service_date: serviceDate || undefined,
                invoice_number: invoiceNumber || undefined,
                notes: notes || undefined,
                internal_notes: internalNotes || undefined,
            });
            toast({ title: 'OS atualizada com sucesso!' });
            onSaved();
            onClose();
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao salvar alterações' });
        } finally {
            setSaving(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar OS — {order.order_number}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Identificação */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Identificação</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Nº OS Concessionária</Label>
                                <Input value={externalOs} onChange={(e) => setExternalOs(e.target.value)} placeholder="Ex: 12345" />
                            </div>
                            <div className="space-y-1">
                                <Label>Data de Serviço</Label>
                                <Input
                                    type="date"
                                    value={serviceDate}
                                    onChange={(e) => setServiceDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Veículo */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Veículo</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Marca</Label>
                                <Input value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="Ex: Toyota" />
                            </div>
                            <div className="space-y-1">
                                <Label>Modelo</Label>
                                <Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Ex: Corolla" />
                            </div>
                            <div className="space-y-1">
                                <Label>Cor</Label>
                                <Input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder="Ex: Branco" />
                            </div>
                            <div className="space-y-1">
                                <Label>Ano</Label>
                                <Input
                                    type="number"
                                    value={vehicleYear}
                                    onChange={(e) => setVehicleYear(e.target.value)}
                                    placeholder="Ex: 2024"
                                    min={1900}
                                    max={2100}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financeiro */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Financeiro</p>
                        <div className="space-y-1">
                            <Label>Número da NF</Label>
                            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Ex: NF-001234" />
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Observações</p>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label>Observações</Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Observações visíveis para todos..."
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Observações Internas</Label>
                                <Textarea
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    placeholder="Notas internas (não visível ao cliente)..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export function ConferencePage() {
    const user = useAuthStore((s) => s.user);
    const { selectedStoreId } = useStoreStore();
    const queryClient = useQueryClient();

    // Filters state
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState(firstOfMonth);
    const [dateTo, setDateTo] = useState(today);
    const [department, setDepartment] = useState<string>('');
    const [search, setSearch] = useState('');

    // Edit state
    const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    // Photo lightbox state
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    const storeId = selectedStoreId ?? user?.store_id ?? undefined;

    const queryKey = ['service-orders', 'conference', storeId, dateFrom, dateTo, department, search];

    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: () => serviceOrdersService.getFiltered({
            store_id: storeId,
            is_verified: false,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            department: department || undefined,
            plate: search || undefined,
            limit: 200,
        }),
        enabled: !!storeId,
    });

    // Lista de serviços para exibir nomes nas colunas
    const { data: servicesData } = useQuery({
        queryKey: ['services', 'all'],
        queryFn: () => servicesService.getAll(),
    });
    const services = servicesData ?? [];

    const verifyMutation = useMutation({
        mutationFn: (id: number) => serviceOrdersService.verify(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-orders', 'conference'] });
            toast({ title: 'OS verificada!' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao verificar OS' });
        },
    });

    const orders = data?.items ?? [];

    const handleVerify = (order: ServiceOrder) => {
        verifyMutation.mutate(order.id);
    };

    const handleEdit = (order: ServiceOrder) => {
        setEditOrder(order);
        setEditOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <ClipboardCheck className="h-6 w-6 text-aems-primary-400" />
                <div>
                    <h1 className="text-2xl font-bold">Conferência de OS</h1>
                    <p className="text-sm text-muted-foreground">
                        OS aguardando verificação
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-4 bg-card rounded-lg border">
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data início</Label>
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-40"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data fim</Label>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-40"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Departamento</Label>
                    <Select value={department || 'all'} onValueChange={(v) => setDepartment(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {Object.entries(DEPARTMENTS_MAP).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Busca (placa/OS)</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Placa ou Nº OS..."
                            className="pl-8 w-48"
                        />
                    </div>
                </div>
            </div>

            {/* Count */}
            <div className="text-sm text-muted-foreground">
                {isLoading ? '...' : `${orders.length} OS aguardando verificação`}
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nº OS Conc.</TableHead>
                            <TableHead>Data Serv.</TableHead>
                            <TableHead>Placa</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Depto</TableHead>
                            <TableHead>Foto</TableHead>
                            <TableHead>Serviços</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 9 }).map((_, j) => (
                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                    Nenhuma OS aguardando verificação
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-sm">
                                        {order.external_os_number || order.order_number || `#${order.id}`}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {formatDate(order.service_date)}
                                    </TableCell>
                                    <TableCell className="font-mono font-medium">
                                        {order.plate}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {order.vehicle_model || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <DeptBadge dept={order.department} />
                                    </TableCell>
                                    <TableCell>
                                        {order.photos?.[0] ? (
                                            <button
                                                onClick={() => setPhotoUrl(order.photos![0])}
                                                className="block rounded overflow-hidden hover:opacity-80 transition-opacity"
                                                title="Ver foto"
                                            >
                                                <img
                                                    src={order.photos[0]}
                                                    alt="Foto da OS"
                                                    className="h-10 w-10 object-cover rounded"
                                                />
                                            </button>
                                        ) : (
                                            <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                        {getServiceNames(order, services)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(calcTotal(order))}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(order)}
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleVerify(order)}
                                                disabled={verifyMutation.isPending}
                                                title="Verificar"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EditDialog
                order={editOrder}
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onSaved={() => queryClient.invalidateQueries({ queryKey: ['service-orders', 'conference'] })}
            />

            {photoUrl && (
                <PhotoDialog
                    url={photoUrl}
                    open={!!photoUrl}
                    onClose={() => setPhotoUrl(null)}
                />
            )}
        </div>
    );
}
