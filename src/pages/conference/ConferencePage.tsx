import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrdersService } from '@/services/api/service-orders.service';
import { servicesService } from '@/services/api/services.service';
import { useAuthStore } from '@/stores/auth.store';
import { useStoreStore } from '@/stores/store.store';
import { useConsultants } from '@/hooks/useConsultants';
import { useVehicleModels } from '@/hooks/useVehicleModels';
import type { ServiceOrder, Department } from '@/types/service-order.types';
import type { Photo } from '@/types/photo.types';
import { DEPARTMENTS_MAP } from '@/constants/service-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Pencil, Search, ClipboardCheck, ImageOff, X, RotateCcw, Trash2, Download, ChevronDown } from 'lucide-react';
import apiClient from '@/services/api/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { uploadService } from '@/services/api/upload.service';
import {
    DeptToggle,
    ServicePicker,
    FilmPicker,
    CompactPhotoUploader,
    type FilmEntry,
} from '@/components/features/service-orders/QuickCreateModal';

// ─── Flag Filter Dropdown (Cortesia / Galpão / Retorno) ───────────────────────

interface FlagFilters { courtesy: boolean; galpon: boolean; retorno: boolean }

function FlagFilterDropdown({ value, onChange }: { value: FlagFilters; onChange: (v: FlagFilters) => void }) {
    const [open, setOpen] = useState(false);

    const active = [
        value.courtesy && 'Cortesia',
        value.galpon   && 'Galpão',
        value.retorno  && 'Retorno',
    ].filter(Boolean) as string[];

    const label = active.length === 0 ? 'Todos' : active.join(', ');

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex h-9 w-52 items-center justify-between gap-2 rounded-lg border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 text-sm text-[#111111] dark:text-white cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] transition-colors"
                >
                    <span className="truncate">{label}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 p-1 border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#1A1A1A]">
                {([
                    { key: 'courtesy', label: 'Cortesia' },
                    { key: 'galpon',   label: 'Galpão'   },
                    { key: 'retorno',  label: 'Retorno'  },
                ] as { key: keyof FlagFilters; label: string }[]).map(opt => (
                    <DropdownMenuCheckboxItem
                        key={opt.key}
                        checked={value[opt.key]}
                        onSelect={(e) => { e.preventDefault(); onChange({ ...value, [opt.key]: !value[opt.key] }); }}
                        className="text-sm text-[#111111] dark:text-white focus:bg-[#F5F5F5] dark:focus:bg-[#2A2A2A] [&>span]:border-2 [&>span]:border-[#F5A800] [&>span]:rounded-sm"
                    >
                        {opt.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
    film:     'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50',
    ppf:      'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50',
    vn:       'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50',
    vu:       'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700/50',
    bodywork: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/50',
    workshop: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
};

function DeptBadge({ dept }: { dept: string }) {
    const colors = DEPT_COLORS[dept] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700';
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

// Remove tags [CORTESIA] e [RETORNO] das observações para exibição
function cleanNotes(notes: string | null | undefined): string {
    if (!notes) return '—';
    const clean = notes
        .replace(/\s*\|\s*\[CORTESIA\]|\[CORTESIA\]\s*\|\s*/g, '')
        .replace(/\s*\|\s*\[RETORNO\]|\[RETORNO\]\s*\|\s*/g, '')
        .trim();
    return clean || '—';
}

// Lista de nomes dos serviços de uma OS
function getServiceList(order: ServiceOrder, services?: Array<{ id: number; name: string; code?: string | null }>): string[] {
    if (!order.items || order.items.length === 0) return [];
    if (!services || services.length === 0) return order.items.map((_, i) => `Serviço #${i + 1}`);
    return order.items.map((item) => {
        const svc = services.find((s) => s.id === item.service_id);
        const name = item.service_name ?? svc?.name ?? `Serviço #${item.service_id}`;
        const code = svc?.code;
        return code ? `${code} - ${name}` : name;
    });
}

// ─── PhotoDialog ───────────────────────────────────────────────────────────────
function PhotoDialog({ url, open, onClose }: { url: string; open: boolean; onClose: () => void }) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl p-2 bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333]">
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
    const [department, setDepartment] = useState<Department | undefined>();
    const [serviceDate, setServiceDate] = useState('');
    const [externalOs, setExternalOs] = useState('');
    const [plate, setPlate] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [consultantId, setConsultantId] = useState<number | undefined>();
    const [isGalpon, setIsGalpon] = useState(false);
    const [isReturn, setIsReturn] = useState(false);
    const [isCourtesy, setIsCourtesy] = useState(false);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [filmEntries, setFilmEntries] = useState<FilmEntry[]>([]);
    const [installers, setInstallers] = useState<number[]>([]);
    const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
    const [newPhoto, setNewPhoto] = useState<Photo[]>([]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const storeId = order?.location_id;
    const { availableStores } = useStoreStore();
    const storeBrandId = availableStores.find((s) => s.id === storeId)?.brand_id;

    const { consultants, isLoading: consultantsLoading } = useConsultants(
        storeId ? { store_id: storeId, is_active: true } : undefined
    );
    const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(
        storeId && storeBrandId ? { brand_id: storeBrandId, active_only: true } : {}
    );

    useEffect(() => {
        if (order) {
            setDepartment(order.department);
            setServiceDate(order.service_date ?? '');
            setExternalOs(order.external_os_number ?? '');
            setPlate(order.plate ?? '');
            setVehicleModel(order.vehicle_model ?? '');
            setVehicleColor(order.vehicle_color ?? '');
            setConsultantId(order.consultant_id ?? undefined);
            setIsGalpon(order.is_galpon ?? false);
            setIsCourtesy(order.is_courtesy ?? false);
            setIsReturn(order.is_return ?? false);
            const rawNotes = order.notes ?? '';
            setNotes(rawNotes.replace(/\s*\|\s*\[CORTESIA\]|\[CORTESIA\]\s*\|\s*/g, '').replace(/\s*\|\s*\[RETORNO\]|\[RETORNO\]\s*\|\s*/g, '').trim());
            setInternalNotes(order.internal_notes ?? '');
            setInvoiceNumber(order.invoice_number ?? '');
            setExistingPhotoUrl(order.photos?.[0] ?? null);
            setNewPhoto([]);

            const isFilm = order.department === 'film' || order.department === 'ppf';
            if (isFilm) {
                setFilmEntries((order.items ?? []).map(item => ({
                    service_id: item.service_id,
                    tonality: item.tonality ?? '',
                    roll_code: item.roll_code ?? '',
                })));
                setSelectedServices([]);
            } else {
                setSelectedServices((order.items ?? []).map(item => item.service_id));
                setFilmEntries([]);
            }
            setInstallers((order.workers ?? []).map(w => w.employee_id).filter(Boolean));
        }
    }, [order?.id]);

    const handleDeptChange = (v: Department) => {
        setDepartment(v);
        setSelectedServices([]);
        setFilmEntries((v === 'film' || v === 'ppf') ? [{ service_id: 0, tonality: '', roll_code: '' }] : []);
        setInstallers([]);
    };

    const handleSave = async () => {
        if (!order) return;
        setSaving(true);
        try {
            let photosPayload: string[] | undefined;
            if (newPhoto.length > 0) {
                const results = await uploadService.uploadPhotos(newPhoto);
                photosPayload = results.map(r => r.url);
            } else if (!existingPhotoUrl) {
                photosPayload = [];
            }

            const notesWithTags = [
                notes || '',
                isCourtesy ? '[CORTESIA]' : '',
                isReturn ? '[RETORNO]' : '',
            ].filter(Boolean).join(' | ');

            const isFilm = department === 'film' || department === 'ppf';
            const itemsPayload = isFilm
                ? filmEntries
                    .filter(e => e.service_id > 0 && e.tonality)
                    .map(e => ({ service_id: e.service_id, quantity: 1, tonality: e.tonality, roll_code: e.roll_code || undefined }))
                : selectedServices.map(id => ({ service_id: id, quantity: 1 }));

            await serviceOrdersService.update(order.id, {
                department: department,
                vehicle_plate: plate || undefined,
                vehicle_model: vehicleModel || undefined,
                vehicle_color: vehicleColor || undefined,
                external_os_number: externalOs || undefined,
                service_date: serviceDate || undefined,
                consultant_id: consultantId ?? undefined,
                is_galpon: isGalpon,
                items: itemsPayload.length > 0 ? itemsPayload : undefined,
                workers: isFilm && installers.length > 0 ? installers.map(id => ({ employee_id: id })) : undefined,
                invoice_number: isFilm ? (invoiceNumber || undefined) : undefined,
                notes: notesWithTags || undefined,
                internal_notes: internalNotes || undefined,
                ...(photosPayload !== undefined && { photos: photosPayload }),
            });
            toast({ title: 'OS atualizada com sucesso!' });
            onSaved();
            onClose();
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detail = (err as any)?.response?.data?.detail;
            const msg = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map((d: { msg?: string }) => d.msg).join('; ')
                    : 'Verifique os dados e tente novamente.';
            toast({ variant: 'destructive', title: 'Erro ao salvar alterações', description: msg });
        } finally {
            setSaving(false);
        }
    };

    if (!order) return null;

    const isFilmDept = department === 'film' || department === 'ppf';
    const showExistingPhoto = !!existingPhotoUrl && newPhoto.length === 0;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button:last-child]:hidden bg-white dark:bg-[#1E1E1E] border-[#D1D1D1] dark:border-[#333333]"
                aria-describedby={undefined}
            >
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E8E8E8] dark:border-[#333333]">
                    <DialogTitle className="text-lg font-bold text-[#111111] dark:text-white">
                        Editar OS — {order.order_number}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 space-y-5">

                    {/* Galpão / Retorno / Cortesia */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Checkbox checked={isGalpon} onCheckedChange={(v) => setIsGalpon(!!v)} />
                            <span className="text-sm font-medium text-zinc-300">Galpão</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Checkbox checked={isReturn} onCheckedChange={(v) => setIsReturn(!!v)} />
                            <span className="text-sm font-medium text-zinc-300">Retorno</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Checkbox checked={isCourtesy} onCheckedChange={(v) => setIsCourtesy(!!v)} />
                            <span className="text-sm font-medium text-zinc-300">Cortesia</span>
                        </label>
                    </div>

                    {/* Departamento */}
                    <DeptToggle value={department} onChange={handleDeptChange} />

                    {/* Data + Nº OS */}
                    <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3 space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">
                                Data do Serviço
                            </Label>
                            <Input
                                type="date"
                                value={serviceDate}
                                onChange={(e) => setServiceDate(e.target.value)}
                                className="h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800]"
                            />
                        </div>
                        {department !== 'vn' && department !== 'vu' && (
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">
                                    Nº OS Concessionária
                                </Label>
                                <Input
                                    value={externalOs}
                                    onChange={(e) => setExternalOs(e.target.value)}
                                    placeholder="Ex: 12345"
                                    className="h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] placeholder:text-[#999999] dark:placeholder:text-zinc-600"
                                />
                            </div>
                        )}
                    </div>

                    {/* Placa / Modelo / Cor */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">
                                Placa / Chassi
                            </Label>
                            <Input
                                value={plate}
                                onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                placeholder="ABC1D23"
                                className="h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] placeholder:text-[#999999] dark:placeholder:text-zinc-600 font-mono tracking-widest uppercase"
                                maxLength={17}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">
                                Modelo
                            </Label>
                            {modelsLoading ? (
                                <Skeleton className="h-9 w-full bg-zinc-800" />
                            ) : (
                                <Select value={vehicleModel} onValueChange={setVehicleModel}>
                                    <SelectTrigger className="h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800]">
                                        <SelectValue placeholder="Selecionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(vehicleModels ?? []).map((m) => (
                                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">Cor</Label>
                            <Input
                                value={vehicleColor}
                                onChange={(e) => setVehicleColor(e.target.value)}
                                placeholder="Branco"
                                className="h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] placeholder:text-[#999999] dark:placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Consultor */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">Consultor</Label>
                        {consultantsLoading ? (
                            <Skeleton className="h-9 w-full bg-zinc-800" />
                        ) : (
                            <Select
                                value={consultantId?.toString() ?? 'none'}
                                onValueChange={(v) => setConsultantId(v === 'none' ? undefined : Number(v))}
                            >
                                <SelectTrigger className="h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800]">
                                    <SelectValue placeholder="Selecionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— Nenhum —</SelectItem>
                                    {consultants.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Serviços */}
                    {isFilmDept ? (
                        <FilmPicker
                            storeId={storeId ?? 0}
                            brandId={storeBrandId}
                            department={department as 'film' | 'ppf'}
                            selectedEntries={filmEntries}
                            onChange={setFilmEntries}
                            installers={installers}
                            onInstallersChange={setInstallers}
                        />
                    ) : (
                        <ServicePicker
                            department={department}
                            brandId={storeBrandId}
                            selectedIds={selectedServices}
                            onChange={setSelectedServices}
                        />
                    )}

                    {/* Foto */}
                    {showExistingPhoto ? (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">Foto da OS</Label>
                            <div className="relative w-20 h-20 shrink-0">
                                <img src={existingPhotoUrl!} alt="Foto da OS" className="w-full h-full object-cover rounded-lg border border-[#333333]" />
                                <button
                                    type="button"
                                    onClick={() => setExistingPhotoUrl(null)}
                                    aria-label="Remover foto"
                                    className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <CompactPhotoUploader photos={newPhoto} onChange={setNewPhoto} />
                    )}

                    {/* NF — apenas película/ppf */}
                    {isFilmDept && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">
                                Número da NF
                            </Label>
                            <Input
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="Ex: NF-001234"
                                className="h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] placeholder:text-[#999999] dark:placeholder:text-zinc-600"
                            />
                        </div>
                    )}

                    {/* Observações */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">Observações</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Informações adicionais..."
                            rows={3}
                            className="rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] placeholder:text-[#999999] dark:placeholder:text-zinc-600 resize-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-[#666666] dark:text-zinc-500">Observações Internas</Label>
                        <Textarea
                            value={internalNotes}
                            onChange={(e) => setInternalNotes(e.target.value)}
                            placeholder="Notas internas..."
                            rows={3}
                            className="rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] placeholder:text-[#999999] dark:placeholder:text-zinc-600 resize-none"
                        />
                    </div>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-[#E8E8E8] dark:border-[#333333] flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} className="border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700/50 hover:text-[#111111] dark:hover:text-white bg-transparent">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                        className="font-semibold hover:opacity-90"
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export function ConferencePage() {
    const user = useAuthStore((s) => s.user);
    const hasDeletePermission = useAuthStore((s) => s.hasPermission);
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
    const [verifiedFilter, setVerifiedFilter] = useState<'pending' | 'verified' | 'all' | 'cancelled'>('pending');
    const [flagFilters, setFlagFilters] = useState({ courtesy: false, galpon: false, retorno: false });
    const [isExporting, setIsExporting] = useState(false);

    // Visibilidade de colunas condicionais por departamento
    const showFilmCols = !department || department === 'film' || department === 'ppf';
    const showTonality = !department || department === 'film';
    const totalCols = 13 + (showFilmCols ? 2 : 0) + (showTonality ? 2 : 0);

    // Edit state
    const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<ServiceOrder | null>(null);

    // Photo lightbox state
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [damagePhotoUrl, setDamagePhotoUrl] = useState<string | null>(null);

    const storeId = selectedStoreId ?? user?.store_id ?? undefined;

    const queryKey = ['service-orders', 'conference', storeId, dateFrom, dateTo, department, search, verifiedFilter, flagFilters];

    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: () => serviceOrdersService.getFiltered({
            store_id: storeId ?? undefined,
            is_verified: verifiedFilter === 'all' || verifiedFilter === 'cancelled' ? undefined : verifiedFilter === 'verified',
            status: verifiedFilter === 'cancelled' ? 'cancelled' : undefined,
            flag: [
                flagFilters.courtesy ? 'courtesy' : null,
                flagFilters.galpon ? 'galpon' : null,
                flagFilters.retorno ? 'retorno' : null,
            ].filter(Boolean) as string[],
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            department: department || undefined,
            plate: search || undefined,
            limit: 200,
        }),
        enabled: true,
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

    const unverifyMutation = useMutation({
        mutationFn: (id: number) => serviceOrdersService.unverify(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-orders', 'conference'] });
            toast({ title: 'Verificação desfeita.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao desfazer verificação' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => serviceOrdersService.cancel(id, 'OS cancelada via conferência'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-orders', 'conference'] });
            toast({ title: 'OS cancelada.' });
            setDeleteTarget(null);
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Erro ao cancelar OS' });
        },
    });

    const orders = data?.items ?? [];

    const handleVerify = (order: ServiceOrder) => {
        verifyMutation.mutate(order.id);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await apiClient.get('/service-orders/export/conferencia', {
                params: {
                    store_id: storeId || undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                    department: department || undefined,
                    is_verified: verifiedFilter === 'verified' ? true : verifiedFilter === 'pending' ? false : undefined,
                    flag: [
                        flagFilters.courtesy ? 'courtesy' : null,
                        flagFilters.galpon ? 'galpon' : null,
                        flagFilters.retorno ? 'retorno' : null,
                    ].filter(Boolean),
                    plate: search || undefined,
                },
                responseType: 'blob',
            });
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conferencia_${dateFrom}_${dateTo}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erro ao exportar conferência:', err);
            toast({ variant: 'destructive', title: 'Erro ao exportar', description: 'Não foi possível gerar o Excel.' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleEdit = (order: ServiceOrder) => {
        setEditOrder(order);
        setEditOpen(true);
    };

    return (
        <div className="p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-6 w-6" style={{ color: '#F5A800' }} />
                    <div>
                        <h1
                            className="text-2xl font-bold text-[#111111] dark:text-white"
                            style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                        >
                            Conferência de OS
                        </h1>
                        <p className="text-sm text-[#666666] dark:text-zinc-400">
                            {verifiedFilter === 'pending' ? 'OS aguardando verificação' : verifiedFilter === 'verified' ? 'OS verificadas' : verifiedFilter === 'cancelled' ? 'OS canceladas' : 'Todas as OS'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={orders.length === 0 || isExporting}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Exportando...' : 'Exportar Excel'}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] rounded-xl p-4 flex flex-wrap gap-3 items-start">
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-500 font-semibold">Data início</Label>
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-40 h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] dark:[color-scheme:dark]"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-500 font-semibold">Data fim</Label>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-40 h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] px-3 outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] dark:[color-scheme:dark]"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-500 font-semibold">Departamento</Label>
                    <Select value={department || 'all'} onValueChange={(v) => setDepartment(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800]">
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
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-500 font-semibold">Status</Label>
                    <Select value={verifiedFilter} onValueChange={(v) => setVerifiedFilter(v as 'pending' | 'verified' | 'all' | 'cancelled')}>
                        <SelectTrigger className="w-40 h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Aguardando</SelectItem>
                            <SelectItem value="verified">Verificadas</SelectItem>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="cancelled">Canceladas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-500 font-semibold">Busca (placa/OS)</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#999999] dark:text-zinc-500" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Placa ou Nº OS..."
                            className="pl-8 w-48 h-9 rounded-lg text-sm text-[#111111] dark:text-white border border-[#D1D1D1] dark:border-[#333333] bg-white dark:bg-[#252525] outline-none focus:ring-2 focus:ring-[#F5A800] focus:border-[#F5A800] placeholder:text-[#999999] dark:placeholder:text-zinc-600"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-[#666666] dark:text-zinc-500 font-semibold">Cortesia/Galpão/Retorno</Label>
                    <FlagFilterDropdown value={flagFilters} onChange={setFlagFilters} />
                </div>
            </div>

            {/* Count */}
            <div className="text-sm text-[#666666] dark:text-zinc-400">
                {isLoading ? '...' : verifiedFilter === 'pending' ? `${orders.length} OS aguardando verificação` : verifiedFilter === 'verified' ? `${orders.length} OS verificadas` : verifiedFilter === 'cancelled' ? `${orders.length} OS canceladas` : `${orders.length} OS no total`}
            </div>

            {/* Table */}
            <div className="border border-[#D1D1D1] dark:border-[#333333] rounded-xl overflow-hidden h-[calc(100vh-400px)] min-h-[300px]">
                <Table wrapperClassName="h-full overflow-auto">
                    <TableHeader className="sticky top-0 z-10 bg-gray-100 dark:bg-zinc-800/60">
                        <TableRow className="border-b border-[#E8E8E8] dark:border-[#333333] hover:bg-transparent">
                            <TableHead className="sticky left-0 z-20 bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3 text-center w-[140px] min-w-[140px] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#D1D1D1] after:dark:bg-zinc-700">Ações</TableHead>
                            <TableHead className="sticky left-[140px] z-20 bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#D1D1D1] after:dark:bg-zinc-700">Foto</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Data Serv.</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Depto</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Consultor</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Cortesia/Galpão</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Nº OS Conc.</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Placa</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Modelo</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Observações</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Serviços</TableHead>
                            {showTonality && <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Tonalidade</TableHead>}
                            {showTonality && <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">N° Pelicula</TableHead>}
                            {showFilmCols && <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Instalador</TableHead>}
                            {showFilmCols && <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Nº NF</TableHead>}
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3 text-right">Valor</TableHead>
                            <TableHead className="text-xs font-semibold text-[#666666] dark:text-zinc-400 uppercase tracking-wide px-4 py-3">Foto de Avaria</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-t border-[#E8E8E8] dark:border-[#333333]">
                                    {Array.from({ length: totalCols }).map((_, j) => (
                                        <TableCell key={j} className="px-4 py-3">
                                            <div className="bg-gray-200 dark:bg-zinc-800 animate-pulse rounded h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow className="border-t border-[#E8E8E8] dark:border-[#333333]">
                                <TableCell colSpan={totalCols} className="text-center py-12 text-[#999999] dark:text-zinc-500">
                                    Nenhuma OS aguardando verificação
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className={`border-t border-[#E8E8E8] dark:border-[#333333] transition-colors ${order.is_verified ? 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100/60 dark:hover:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/40'}`}>
                                    {/* Ações */}
                                    <TableCell className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-4 py-3 w-[140px] min-w-[140px] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#E8E8E8] after:dark:bg-zinc-700">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEdit(order)}
                                                title="Editar"
                                                className="h-8 w-8 rounded-lg text-[#666666] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors flex items-center justify-center"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            {order.is_verified ? (
                                                <button
                                                    onClick={() => unverifyMutation.mutate(order.id)}
                                                    disabled={unverifyMutation.isPending}
                                                    title="Desfazer verificação"
                                                    className="h-8 w-8 rounded-lg text-amber-500 hover:text-amber-400 hover:bg-amber-900/20 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleVerify(order)}
                                                    disabled={verifyMutation.isPending}
                                                    title="Verificar"
                                                    className="h-8 w-8 rounded-lg text-green-500 hover:text-green-400 hover:bg-green-900/20 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                            )}
                                            {hasDeletePermission('conference', 'delete') && (
                                                <button
                                                    onClick={() => setDeleteTarget(order)}
                                                    title="Excluir OS"
                                                    className="h-8 w-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors flex items-center justify-center"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                    {/* Foto */}
                                    <TableCell className="sticky left-[140px] z-10 bg-white dark:bg-zinc-900 px-4 py-3 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#E8E8E8] after:dark:bg-zinc-700">
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
                                            <ImageOff className="h-5 w-5 text-zinc-600" />
                                        )}
                                    </TableCell>
                                    {/* Data Serv. */}
                                    <TableCell className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200">
                                        {formatDate(order.service_date)}
                                    </TableCell>
                                    {/* Depto */}
                                    <TableCell className="px-4 py-3">
                                        <DeptBadge dept={order.department} />
                                    </TableCell>
                                    {/* Consultor */}
                                    <TableCell className="px-4 py-3 text-sm text-[#666666] dark:text-zinc-400">
                                        {order.consultant_name || '—'}
                                    </TableCell>
                                    {/* Cortesia / Galpão */}
                                    <TableCell className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            {order.is_courtesy && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 w-fit">
                                                    Cortesia
                                                </span>
                                            )}
                                            {order.is_galpon && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700/50 w-fit">
                                                    Galpão
                                                </span>
                                            )}
                                            {!order.is_courtesy && !order.is_galpon && (
                                                <span className="text-sm text-zinc-400">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    {/* Nº OS Conc. */}
                                    <TableCell className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200 font-mono">
                                        <div className="flex flex-col gap-0.5">
                                            <span>{order.external_os_number || (['vn', 'vu'].includes(order.department) ? '—' : (order.order_number || `#${order.id}`))}</span>
                                            {order.is_return && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50 w-fit">
                                                    Retorno
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    {/* Placa */}
                                    <TableCell className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200 font-mono font-medium">
                                        {order.plate}
                                    </TableCell>
                                    {/* Modelo */}
                                    <TableCell className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200">
                                        {order.vehicle_model || '—'}
                                    </TableCell>
                                    {/* Observações */}
                                    <TableCell className="px-4 py-3 text-sm text-[#666666] dark:text-zinc-400 max-w-[180px]">
                                        <span
                                            className="block truncate"
                                            title={cleanNotes(order.notes) !== '—' ? cleanNotes(order.notes) : undefined}
                                        >
                                            {cleanNotes(order.notes)}
                                        </span>
                                    </TableCell>
                                    {/* Serviços */}
                                    <TableCell className="px-4 py-3 text-sm text-[#666666] dark:text-zinc-400 max-w-[220px]">
                                        {(() => {
                                            const list = getServiceList(order, services);
                                            if (list.length === 0) return <span>—</span>;
                                            const preview = list.length === 1
                                                ? list[0]
                                                : `${list[0].length > 22 ? list[0].slice(0, 22) + '…' : list[0]} +${list.length - 1}`;
                                            return (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="cursor-default truncate block">{preview}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom" className="max-w-xs p-2">
                                                            <ul className="space-y-0.5">
                                                                {list.map((name, i) => (
                                                                    <li key={i} className="text-xs">{name}</li>
                                                                ))}
                                                            </ul>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                        })()}
                                    </TableCell>
                                    {/* Tonalidade (film) */}
                                    {showTonality && (
                                        <TableCell className="px-4 py-3 text-sm text-[#666666] dark:text-zinc-400">
                                            {order.department === 'film'
                                                ? (order.items?.map(i => i.tonality).filter(Boolean).join(', ') || '—')
                                                : <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                            }
                                        </TableCell>
                                    )}
                                    {/* N° Pelicula (film) */}
                                    {showTonality && (
                                        <TableCell className="px-4 py-3 text-sm text-[#666666] dark:text-zinc-400 font-mono">
                                            {order.department === 'film'
                                                ? (order.items?.map(i => i.roll_code).filter(Boolean).join(', ') || '—')
                                                : <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                            }
                                        </TableCell>
                                    )}
                                    {/* Instalador (film/ppf) */}
                                    {showFilmCols && (
                                        <TableCell className="px-4 py-3 text-sm text-[#666666] dark:text-zinc-400">
                                            {(order.department === 'film' || order.department === 'ppf')
                                                ? (order.workers && order.workers.length > 0
                                                    ? order.workers.map(w => w.name).join(', ')
                                                    : '—')
                                                : <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                            }
                                        </TableCell>
                                    )}
                                    {/* Nº NF (film/ppf) */}
                                    {showFilmCols && (
                                        <TableCell className="px-4 py-3 text-sm text-[#666666] dark:text-zinc-400 font-mono">
                                            {(order.department === 'film' || order.department === 'ppf')
                                                ? (order.invoice_number || '—')
                                                : <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                            }
                                        </TableCell>
                                    )}
                                    {/* Valor */}
                                    <TableCell className="px-4 py-3 text-sm text-[#111111] dark:text-zinc-200 text-right font-medium">
                                        {formatCurrency(calcTotal(order))}
                                    </TableCell>
                                    {/* Foto de Avaria */}
                                    <TableCell className="px-4 py-3">
                                        {order.damage_photos?.[0] ? (
                                            <button
                                                onClick={() => setDamagePhotoUrl(order.damage_photos![0])}
                                                className="block rounded overflow-hidden hover:opacity-80 transition-opacity"
                                                title="Ver foto de avaria"
                                            >
                                                <img
                                                    src={order.damage_photos[0]}
                                                    alt="Foto de avaria"
                                                    className="h-10 w-10 object-cover rounded"
                                                />
                                            </button>
                                        ) : (
                                            <ImageOff className="h-5 w-5 text-zinc-600" />
                                        )}
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
            {damagePhotoUrl && (
                <PhotoDialog
                    url={damagePhotoUrl}
                    open={!!damagePhotoUrl}
                    onClose={() => setDamagePhotoUrl(null)}
                />
            )}

            <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <DialogContent className="max-w-sm bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333]">
                    <DialogHeader>
                        <DialogTitle className="text-[#111111] dark:text-white">Cancelar OS?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#666666] dark:text-zinc-400">
                        A OS <span className="font-semibold text-[#111111] dark:text-white">#{deleteTarget?.id}</span> será cancelada e não aparecerá mais na listagem padrão. É possível visualizá-la filtrando por "Canceladas".
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Voltar
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                        >
                            {deleteMutation.isPending ? 'Cancelando...' : 'Confirmar'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
