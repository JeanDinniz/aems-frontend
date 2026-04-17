import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';
import { useStoreStore } from '@/stores/store.store';
import { useVehicleModels } from '@/hooks/useVehicleModels';
import { useServices } from '@/hooks/useServices';
import { useFilmInstallers } from '@/hooks/useEmployees';
import { useConsultants } from '@/hooks/useConsultants';
import { useCreateServiceOrder } from '@/hooks/useServiceOrders';
import type { Department } from '@/types/service-order.types';
import { CourtesyReturnSelect } from './CourtesyReturnSelect';
import type { Photo } from '@/types/photo.types';
import { compressImage } from '@/utils/imageCompression';
import { validateImageFile } from '@/utils/fileValidation';
import { logger } from '@/lib/logger';
import { uploadService } from '@/services/api/upload.service';
import {
    Camera,
    X,
    Check,
    ChevronsUpDown,
    ChevronDown,
    ChevronRight,
    Search,
} from 'lucide-react';

// ─── Tonality options ─────────────────────────────────────────────────────────
const TONALITY_OPTIONS = [
    { value: 'G05', label: 'G05' },
    { value: 'G20', label: 'G20' },
    { value: 'G35', label: 'G35' },
    { value: 'G75', label: 'G75 (Transparente)' },
];

// ─── Plate / Chassi validation ────────────────────────────────────────────────
const PLATE_MERCOSUL = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
const PLATE_OLD      = /^[A-Z]{3}[0-9]{4}$/;
const CHASSI_VIN     = /^[A-HJ-NPR-Z0-9]{17}$/; // VIN padrão — sem I, O, Q
const CHASSI_CURTO   = /^[A-Z0-9]{4,17}$/;       // Chassi curto (BYD, vidro, etc.) — 4 a 17 chars

function isValidPlateOrChassi(value: string): boolean {
    const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return PLATE_MERCOSUL.test(v) || PLATE_OLD.test(v) || CHASSI_VIN.test(v) || CHASSI_CURTO.test(v);
}

// ─── Zod schema ───────────────────────────────────────────────────────────────
const schema = z.object({
    department: z.enum(['film', 'ppf', 'vn', 'vd', 'vu', 'bodywork', 'workshop'] as const, {
        error: 'Selecione um departamento',
    }),
    plate: z
        .string()
        .min(1, 'Placa ou chassi obrigatório')
        .refine((v) => isValidPlateOrChassi(v), 'Formato inválido. Use placa (ex: ABC1D23) ou chassi (4-17 caracteres alfanuméricos)'),
    vehicle_model: z.string().min(1, 'Modelo obrigatório'),
    vehicle_model_id: z.number().optional(),
    vehicle_color: z.string().optional(),
    consultant_id: z.number().optional(),
    external_os_number: z.string().optional(), // validação condicional via superRefine
    selected_services: z.array(z.number()).default([]),
    is_return: z.boolean().default(false),
    is_courtesy: z.boolean().default(false),
    courtesy_return_set: z.boolean().refine((v) => v === true, { message: 'Selecione uma opção' }),
    is_galpon: z.boolean().default(false),
    notes: z.string().optional(),
    service_date: z.string().min(1, 'Data do serviço obrigatória'),
    film_entries: z.array(z.object({
        service_id: z.number(),
        tonality:   z.string(),
        roll_code:  z.string().optional(),
    })).optional(),
    installers: z.array(z.number()).optional(),
    form_store_id: z.number().optional(),
}).superRefine((data, ctx) => {
    if (data.department === 'film' || data.department === 'ppf') {
        if (!data.film_entries || data.film_entries.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Adicione ao menos uma película',
                path: ['film_entries'],
            });
        } else {
            data.film_entries.forEach((entry, i) => {
                if (!entry.service_id || entry.service_id <= 0) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione uma película', path: ['film_entries', i, 'service_id'] });
                }
                if (!entry.tonality) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione a tonalidade', path: ['film_entries', i, 'tonality'] });
                }
                if (data.department === 'film' && (!entry.roll_code || !entry.roll_code.trim())) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Código do Rolo obrigatório para Película', path: ['film_entries', i, 'roll_code'] });
                }
            });
        }
    } else if (data.department) {
        if (data.selected_services.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Selecione pelo menos 1 serviço',
                path: ['selected_services'],
            });
        }
    }

    if (data.department !== 'vn' && data.department !== 'vd' && data.department !== 'vu' && !data.external_os_number?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Nº OS Concessionária obrigatório',
            path: ['external_os_number'],
        });
    }
});

type QuickCreateFormData = z.infer<typeof schema>;

// ─── Department config ────────────────────────────────────────────────────────
interface DeptOption {
    value: Department;
    label: string;
}

const DEPT_OPTIONS: DeptOption[] = [
    { value: 'film',     label: 'Película' },
    { value: 'ppf',      label: 'PPF' },
    { value: 'vn',       label: 'VN' },
    { value: 'vd',       label: 'Venda Direta' },
    { value: 'vu',       label: 'VU' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'workshop', label: 'Oficina' },
];

// ─── Sub-component: department toggle buttons ─────────────────────────────────
export interface DeptToggleProps {
    value: Department | undefined;
    onChange: (v: Department) => void;
    error?: string;
}

export function DeptToggle({ value, onChange, error }: DeptToggleProps) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Departamento <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
                {DEPT_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            value === opt.value
                                ? 'bg-[#F5A800] border-[#F5A800] text-[#111111]'
                                : 'border-[#D1D1D1] dark:border-[#333333] text-[#444444] dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-[#BDBDBD] dark:hover:border-zinc-600'
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// ─── Sub-component: inline service picker (no prices) ─────────────────────────
export interface ServicePickerProps {
    department: Department | undefined;
    brandId?: number;
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    error?: string;
}

export function ServicePicker({ department, brandId, selectedIds, onChange, error }: ServicePickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const { data: services, isLoading } = useServices(department, brandId);

    const filtered = (services ?? []).filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggle = useCallback(
        (id: number) => {
            onChange(
                selectedIds.includes(id)
                    ? selectedIds.filter((x) => x !== id)
                    : [...selectedIds, id]
            );
        },
        [selectedIds, onChange]
    );

    const removeChip = useCallback(
        (id: number) => {
            onChange(selectedIds.filter((x) => x !== id));
        },
        [selectedIds, onChange]
    );

    const selectedNames = selectedIds
        .map((id) => services?.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[];

    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Serviços <span className="text-destructive">*</span>
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        type="button"
                        className={cn(
                            'w-full justify-between h-10',
                            selectedIds.length === 0 && 'text-muted-foreground'
                        )}
                    >
                        {selectedIds.length > 0
                            ? `${selectedIds.length} serviço(s) selecionado(s)`
                            : 'Selecionar serviços...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] p-0" align="start">
                    <div className="flex items-center border-b px-3 py-2 gap-2">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Buscar serviço..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isLoading ? (
                        <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                            <Skeleton className="h-4 w-3/5" />
                        </div>
                    ) : !department ? (
                        <p className="p-4 text-sm text-muted-foreground text-center">
                            Selecione um departamento primeiro
                        </p>
                    ) : filtered.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground text-center">
                            Nenhum serviço encontrado
                        </p>
                    ) : (
                        <ScrollArea className="h-[240px]">
                            <div className="p-1">
                                {filtered.map((svc) => (
                                    <div
                                        key={svc.id}
                                        className="flex items-center gap-2 px-3 py-2 rounded-sm cursor-pointer hover:bg-accent"
                                        onClick={() => toggle(svc.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(svc.id); }}
                                        role="checkbox"
                                        aria-checked={selectedIds.includes(svc.id)}
                                        tabIndex={0}
                                    >
                                        <div
                                            className={cn(
                                                'flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0',
                                                selectedIds.includes(svc.id)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible'
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className="text-sm">{svc.name}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </PopoverContent>
            </Popover>

            {selectedNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedNames.map((name, idx) => (
                        <Badge
                            key={selectedIds[idx]}
                            variant="secondary"
                            className="text-xs gap-1 pr-1"
                        >
                            {name}
                            <button
                                type="button"
                                onClick={() => removeChip(selectedIds[idx])}
                                className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                                aria-label={`Remover ${name}`}
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// ─── Sub-component: FilmPicker ────────────────────────────────────────────────
export interface FilmEntry {
    service_id: number;
    tonality: string;
    roll_code?: string;
}

export interface FilmPickerProps {
    storeId: number;
    brandId?: number;
    department: 'film' | 'ppf';
    selectedEntries: FilmEntry[];
    onChange: (entries: FilmEntry[]) => void;
    installers: number[];
    onInstallersChange: (ids: number[]) => void;
    error?: string;
    rollCodeErrors?: Record<number, string>;
}

export function FilmPicker({
    storeId: _storeId,
    brandId,
    department,
    selectedEntries,
    onChange,
    installers,
    onInstallersChange,
    error,
    rollCodeErrors,
}: FilmPickerProps) {
    const [installersOpen, setInstallersOpen] = useState(false);
    const { data: services, isLoading: servicesLoading } = useServices(department, brandId);
    const { data: employeesData, isLoading: employeesLoading } = useFilmInstallers(department);

    const employees = (employeesData ?? []).filter(
        (e) => e.position === 'Instalador de Película'
    );

    const updateEntry = useCallback(
        (index: number, field: keyof FilmEntry, value: string | number) => {
            const updated = selectedEntries.map((entry, i) =>
                i === index ? { ...entry, [field]: value } : entry
            );
            onChange(updated);
        },
        [selectedEntries, onChange]
    );

    const addEntry = useCallback(() => {
        onChange([...selectedEntries, { service_id: 0, tonality: '', roll_code: '' }]);
    }, [selectedEntries, onChange]);

    const removeEntry = useCallback(
        (index: number) => {
            onChange(selectedEntries.filter((_, i) => i !== index));
        },
        [selectedEntries, onChange]
    );

    const toggleInstaller = useCallback(
        (id: number) => {
            onInstallersChange(
                installers.includes(id)
                    ? installers.filter((x) => x !== id)
                    : [...installers, id]
            );
        },
        [installers, onInstallersChange]
    );

    return (
        <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {department === 'ppf' ? 'PPF' : 'Películas'} <span className="text-destructive">*</span>
            </Label>

            <div className="space-y-2">
                {selectedEntries.map((entry, index) => (
                    <div
                        key={index}
                        className="border border-[#D1D1D1] dark:border-[#333333] rounded-lg p-3 space-y-2 bg-gray-50/50 dark:bg-zinc-800/30"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Filme {index + 1}
                            </span>
                            {selectedEntries.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeEntry(index)}
                                    aria-label={`Remover filme ${index + 1}`}
                                    className="text-muted-foreground hover:text-destructive transition-colors rounded p-0.5"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {servicesLoading ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <Select
                                value={entry.service_id > 0 ? entry.service_id.toString() : ''}
                                onValueChange={(v) => updateEntry(index, 'service_id', Number(v))}
                            >
                                <SelectTrigger className="w-full h-10">
                                    <SelectValue placeholder="Selecionar película..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(services ?? []).map((svc) => (
                                        <SelectItem key={svc.id} value={svc.id.toString()}>
                                            {svc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                value={entry.tonality}
                                onValueChange={(v) => updateEntry(index, 'tonality', v)}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Tonalidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TONALITY_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="space-y-1">
                                <Input
                                    value={entry.roll_code ?? ''}
                                    onChange={(e) => updateEntry(index, 'roll_code', e.target.value)}
                                    placeholder={department === 'film' ? 'Código do Rolo *' : 'Código do Rolo (opcional)'}
                                    className={cn('h-10', rollCodeErrors?.[index] && 'border-destructive')}
                                />
                                {rollCodeErrors?.[index] && (
                                    <p className="text-xs text-destructive">{rollCodeErrors[index]}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addEntry}
                className="text-sm font-medium text-[#E89200] hover:text-[#D47F00] transition-colors"
            >
                + Adicionar {department === 'ppf' ? 'PPF' : 'Película'}
            </button>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Instaladores
                </Label>
                {employeesLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                ) : employees.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum instalador disponível</p>
                ) : (
                    <Popover open={installersOpen} onOpenChange={setInstallersOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={installersOpen}
                                className="w-full justify-between font-normal"
                            >
                                <span className="truncate">
                                    {installers.length === 0
                                        ? 'Selecionar instaladores...'
                                        : `${installers.length} instalador(es) selecionado(s)`}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
                            {employees.map((emp: { id: number; name: string }) => (
                                <div
                                    key={emp.id}
                                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent select-none"
                                    onClick={() => toggleInstaller(emp.id)}
                                >
                                    <Checkbox
                                        checked={installers.includes(emp.id)}
                                        onCheckedChange={() => toggleInstaller(emp.id)}
                                        id={`installer-${emp.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-sm">{emp.name}</span>
                                </div>
                            ))}
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </div>
    );
}

// ─── Sub-component: camera photo capture ──────────────────────────────────────
export interface CompactPhotoUploaderProps {
    photos: Photo[];
    onChange: (photos: Photo[]) => void;
    label?: string;
}

export function CompactPhotoUploader({ photos, onChange, label = 'Foto da OS' }: CompactPhotoUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleCapture = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!inputRef.current) return;
            inputRef.current.value = '';
            if (!file) return;

            const validation = validateImageFile(file);
            if (!validation.valid) {
                toast({ variant: 'destructive', title: 'Arquivo inválido', description: validation.error });
                return;
            }

            const preview = URL.createObjectURL(file);
            try {
                const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 });
                onChange([{
                    id: crypto.randomUUID(),
                    file,
                    preview,
                    compressed,
                    uploaded: false,
                    uploadProgress: 0,
                }]);
            } catch (err) {
                logger.error('Erro ao comprimir imagem:', err);
                URL.revokeObjectURL(preview);
            }
        },
        [onChange]
    );

    const remove = useCallback(() => {
        if (photos[0]) URL.revokeObjectURL(photos[0].preview);
        onChange([]);
    }, [photos, onChange]);

    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </Label>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCapture}
            />
            {photos.length === 0 ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D1D1D1] dark:border-[#333333] text-sm text-[#666666] dark:text-zinc-400 hover:border-[#F5A800] hover:text-[#F5A800] transition-colors"
                >
                    <Camera className="h-4 w-4" />
                    Tirar foto
                </button>
            ) : (
                <div className="relative w-20 h-20 shrink-0">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="w-full h-full p-0 border-0 bg-transparent"
                        aria-label="Alterar foto"
                    >
                        <img
                            src={photos[0].preview}
                            alt={label}
                            className="w-full h-full object-cover rounded-lg border"
                        />
                    </button>
                    <button
                        type="button"
                        onClick={remove}
                        aria-label="Remover foto"
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main QuickCreateModal ────────────────────────────────────────────────────
interface QuickCreateModalProps {
    open: boolean;
    onClose: () => void;
}

export function QuickCreateModal({ open, onClose }: QuickCreateModalProps) {
    const user = useAuthStore((s) => s.user);
    const effectivePermissions = useAuthStore((s) => s.effectivePermissions);
    const isGalponProfile = effectivePermissions?.is_galpon_profile === true;
    const hideGalponOption = !isGalponProfile && effectivePermissions?.hide_galpon_option === true;
    const { availableStores, selectedStoreId } = useStoreStore();
    const createServiceOrder = useCreateServiceOrder();

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [damagePhotos, setDamagePhotos] = useState<Photo[]>([]);
    const plateInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const scrollToFirstError = useCallback((fieldErrors: Record<string, unknown>) => {
        const fieldOrder = [
            'courtesy_return_set',
            'department',
            'service_date',
            'external_os_number',
            'plate',
            'vehicle_model',
            'selected_services',
            'film_entries',
        ];
        for (const field of fieldOrder) {
            if (!(field in fieldErrors)) continue;
            const el = formRef.current?.querySelector(`[data-field="${field}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
        }
    }, []);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<QuickCreateFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema) as any,
        defaultValues: {
            department: undefined,
            plate: '',
            vehicle_model: '',
            vehicle_model_id: undefined,
            vehicle_color: '',
            consultant_id: undefined,
            external_os_number: '',
            selected_services: [],
            is_return: false,
            is_courtesy: false,
            courtesy_return_set: false,
            is_galpon: false,
            notes: '',
            service_date: new Date().toISOString().split('T')[0],
            film_entries: [],
            installers: [],
            form_store_id: undefined,
        },
    });

    const department         = watch('department');
    const selectedSvcs       = watch('selected_services');
    const isReturn           = watch('is_return');
    const isCourtesy         = watch('is_courtesy');
    const courtesyReturnSet  = watch('courtesy_return_set');
    const isGalpon           = watch('is_galpon');
    const formStoreId  = watch('form_store_id');

    // Resolve loja: form_store_id (multi-store) or selectedStoreId/user's store
    const storeId = formStoreId ?? selectedStoreId ?? user?.store_id ?? undefined;
    const currentStore = availableStores.find((s) => s.id === storeId);
    const storeBrandId = currentStore?.brand_id ?? undefined;

    // On open: pre-fill form_store_id and force is_galpon for galpon-profile users
    useEffect(() => {
        if (open) {
            if (formStoreId === undefined) {
                const defaultId = selectedStoreId ?? user?.store_id ?? availableStores[0]?.id;
                if (defaultId) setValue('form_store_id', defaultId);
            }
            if (isGalponProfile) {
                setValue('is_galpon', true);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    const { consultants, isLoading: consultantsLoading } = useConsultants(
        storeId ? { store_id: storeId, is_active: true } : undefined
    );

    // Vehicle models loaded by brand_id of the selected store
    const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(
        storeBrandId ? { brand_id: storeBrandId, active_only: true } : {}
    );

    // Focus plate when modal opens
    useEffect(() => {
        if (open) {
            setTimeout(() => plateInputRef.current?.focus(), 100);
        }
    }, [open]);

    // Reset everything on close
    const handleClose = useCallback(() => {
        reset();
        setPhotos([]);
        setDamagePhotos([]);
        onClose();
    }, [reset, onClose]);

    // Full reset: clear form and stay open for next OS
    const fullReset = useCallback(() => {
        const currentFormStoreId = formStoreId ?? selectedStoreId ?? user?.store_id ?? availableStores[0]?.id;
        reset({
            department: undefined,
            plate: '',
            vehicle_model: '',
            vehicle_model_id: undefined,
            vehicle_color: '',
            consultant_id: undefined,
            external_os_number: '',
            selected_services: [],
            is_return: false,
            is_courtesy: false,
            courtesy_return_set: false,
            is_galpon: isGalponProfile ? true : false,
            notes: '',
            service_date: new Date().toISOString().split('T')[0],
            film_entries: [],
            installers: [],
            form_store_id: currentFormStoreId,
        });
        setPhotos([]);
        setDamagePhotos([]);
        setTimeout(() => plateInputRef.current?.focus(), 50);
    }, [reset, formStoreId, selectedStoreId, user, availableStores, isGalponProfile]);

    // Partial reset: keep dept and store — for "Salvar e Próxima"
    const partialReset = useCallback(
        (savedDept: Department | undefined, savedFormStoreId: number | undefined) => {
            reset({
                department: savedDept,
                plate: '',
                vehicle_model: '',
                vehicle_model_id: undefined,
                vehicle_color: '',
                consultant_id: undefined,
                external_os_number: '',
                selected_services: [],
                is_return: false,
                is_courtesy: false,
                courtesy_return_set: false,
                is_galpon: isGalponProfile ? true : false,
                notes: '',
                service_date: new Date().toISOString().split('T')[0],
                film_entries: (savedDept === 'film' || savedDept === 'ppf') ? [{ service_id: 0, tonality: '', roll_code: '' }] : [],
                installers: [],
                form_store_id: savedFormStoreId,
            });
            setPhotos([]);
            setDamagePhotos([]);
            setTimeout(() => plateInputRef.current?.focus(), 50);
        },
        [reset, isGalponProfile]
    );

    const buildPayload = useCallback(
        (data: QuickCreateFormData, uploadedPhotoUrls: string[], uploadedDamageUrls: string[] = []) => {
            const resolvedStoreId = data.form_store_id ?? storeId ?? 0;
            const resolvedStore = availableStores.find((s) => s.id === resolvedStoreId);

            const notesText = data.notes || undefined;

            const isFilmDept = data.department === 'film' || data.department === 'ppf';

            const items = isFilmDept
                ? data.film_entries!.map((e) => ({
                    service_id: e.service_id,
                    quantity:   1,
                    tonality:   e.tonality,
                    roll_code:  e.roll_code || undefined,
                }))
                : data.selected_services.map((id) => ({ service_id: id, quantity: 1 }));

            const workers = isFilmDept
                ? (data.installers ?? []).map((id) => ({ employee_id: id }))
                : undefined;

            return {
                plate: data.plate.toUpperCase(),
                vehicle_plate: data.plate.toUpperCase(),
                vehicle_model: data.vehicle_model,
                vehicle_model_id: data.vehicle_model_id || undefined,
                vehicle_color: data.vehicle_color || undefined,
                department: data.department,
                location_id: resolvedStoreId,
                store_id: resolvedStoreId,
                dealership_id: resolvedStore?.dealership_id || undefined,
                consultant_id: data.consultant_id || undefined,
                external_os_number: data.external_os_number || undefined,
                is_galpon: data.is_galpon,
                is_return: data.is_return,
                is_courtesy: data.is_courtesy,
                items,
                workers,
                notes: notesText,
                photos: uploadedPhotoUrls,
                damage_photos: uploadedDamageUrls,
                service_date: data.service_date,
            };
        },
        [storeId, availableStores]
    );

    const uploadPhotos = useCallback(async (): Promise<string[]> => {
        const unuploaded = photos.filter((p) => !p.url);
        if (unuploaded.length === 0) return photos.map((p) => p.url).filter(Boolean) as string[];
        try {
            const results = await uploadService.uploadPhotos(unuploaded);
            const urlMap = new Map(results.map((r) => [r.id, r.url]));
            const updated = photos.map((p) => urlMap.has(p.id) ? { ...p, url: urlMap.get(p.id), uploaded: true } : p);
            setPhotos(updated);
            return updated.map((p) => p.url).filter(Boolean) as string[];
        } catch {
            throw new Error('Falha ao enviar foto. Tente novamente.');
        }
    }, [photos]);

    const uploadDamagePhotos = useCallback(async (): Promise<string[]> => {
        const unuploaded = damagePhotos.filter((p) => !p.url);
        if (unuploaded.length === 0) return damagePhotos.map((p) => p.url).filter(Boolean) as string[];
        try {
            const results = await uploadService.uploadPhotos(unuploaded);
            const urlMap = new Map(results.map((r) => [r.id, r.url]));
            const updated = damagePhotos.map((p) => urlMap.has(p.id) ? { ...p, url: urlMap.get(p.id), uploaded: true } : p);
            setDamagePhotos(updated);
            return updated.map((p) => p.url).filter(Boolean) as string[];
        } catch {
            throw new Error('Falha ao enviar foto de avaria. Tente novamente.');
        }
    }, [damagePhotos]);

    const onSave = handleSubmit(async (rawData) => {
        const data = rawData as QuickCreateFormData;
        try {
            const [uploadedUrls, damageUrls] = await Promise.all([uploadPhotos(), uploadDamagePhotos()]);
            await createServiceOrder.mutateAsync(buildPayload(data, uploadedUrls, damageUrls));
            toast({ title: 'OS lançada com sucesso!' });
            fullReset();
            onClose();
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detail = (err as any)?.response?.data?.detail;
            const msg = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map((d: { msg?: string }) => d.msg).join('; ')
                    : err instanceof Error
                        ? err.message
                        : 'Verifique os dados e tente novamente.';
            toast({ variant: 'destructive', title: 'Erro ao lançar OS', description: msg });
        }
    }, scrollToFirstError);

    const onSaveAndNext = handleSubmit(async (rawData) => {
        const data = rawData as QuickCreateFormData;
        const savedDept      = data.department;
        const savedFormStore = data.form_store_id;

        try {
            const [uploadedUrls, damageUrls] = await Promise.all([uploadPhotos(), uploadDamagePhotos()]);
            await createServiceOrder.mutateAsync(buildPayload(data, uploadedUrls, damageUrls));
            toast({ title: 'OS lançada! Próxima OS...' });
            partialReset(savedDept, savedFormStore);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detail = (err as any)?.response?.data?.detail;
            const msg = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map((d: { msg?: string }) => d.msg).join('; ')
                    : err instanceof Error
                        ? err.message
                        : 'Verifique os dados e tente novamente.';
            toast({ variant: 'destructive', title: 'Erro ao lançar OS', description: msg });
        }
    }, scrollToFirstError);

    const isBusy = isSubmitting || createServiceOrder.isPending;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button:last-child]:hidden"
                aria-describedby={undefined}
            >
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-bold">Lançar OS</DialogTitle>
                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label="Fechar"
                            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Fechar</span>
                        </button>
                    </div>
                </DialogHeader>

                <form ref={formRef} className="px-6 py-4 space-y-5" onSubmit={(e) => e.preventDefault()}>

                    {/* Row 1: Loja | Cortesia/Retorno + Galpão */}
                    <div className="space-y-3">
                        {/* Loja */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Loja
                            </Label>
                            {availableStores.length === 1 ? (
                                <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted/40 text-sm font-medium text-foreground">
                                    {availableStores[0].name}
                                </div>
                            ) : (
                                <Select
                                    value={formStoreId?.toString() ?? ''}
                                    onValueChange={(v) => setValue('form_store_id', v ? Number(v) : undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecionar loja..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStores.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Cortesia/Retorno + Galpão */}
                        <div className="space-y-1.5" data-field="courtesy_return_set">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Cortesia/Retorno <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-3">
                                <CourtesyReturnSelect
                                    value={{ is_courtesy: isCourtesy, is_return: isReturn }}
                                    isSet={courtesyReturnSet}
                                    error={errors.courtesy_return_set?.message}
                                    onChange={({ is_courtesy, is_return }) => {
                                        setValue('is_courtesy', is_courtesy);
                                        setValue('is_return', is_return);
                                        setValue('courtesy_return_set', true, { shouldValidate: true });
                                    }}
                                />
                                {!hideGalponOption && (
                                    <label
                                        htmlFor="is_galpon"
                                        className={cn(
                                            'flex h-9 items-center gap-2 rounded-md border px-4 select-none text-sm font-medium',
                                            'bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333]',
                                            'hover:bg-[#F5F5F5] dark:hover:bg-[#222222] transition-colors',
                                            isGalpon && 'border-[#F5A800] text-[#F5A800]',
                                            isGalponProfile ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                                        )}
                                    >
                                        <Checkbox
                                            checked={isGalpon}
                                            onCheckedChange={(v) => {
                                                if (!isGalponProfile) setValue('is_galpon', Boolean(v));
                                            }}
                                            id="is_galpon"
                                            disabled={isGalponProfile}
                                            className="border-[#F5A800] data-[state=checked]:bg-[#F5A800] data-[state=checked]:border-[#F5A800]"
                                        />
                                        Galpão
                                    </label>
                                )}
                            </div>
                            {errors.courtesy_return_set && (
                                <p className="text-xs text-destructive">{errors.courtesy_return_set.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Departamento */}
                    <div data-field="department">
                        <DeptToggle
                            value={department}
                            onChange={(v) => {
                                setValue('department', v, { shouldValidate: true });
                                setValue('selected_services', []);
                                setValue('film_entries', (v === 'film' || v === 'ppf') ? [{ service_id: 0, tonality: '', roll_code: '' }] : []);
                                setValue('installers', []);
                            }}
                            error={errors.department?.message}
                        />
                    </div>

                    {/* Row: Data do Serviço + Nº OS Concessionária */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div className="sm:col-span-3 space-y-1.5" data-field="service_date">
                            <Label htmlFor="service_date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Data do Serviço <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="service_date"
                                type="date"
                                {...register('service_date')}
                                max={new Date().toISOString().split('T')[0]}
                                className={cn(errors.service_date && 'border-destructive')}
                            />
                            {errors.service_date && (
                                <p className="text-xs text-destructive">{errors.service_date.message}</p>
                            )}
                        </div>

                        {(department !== 'vn' && department !== 'vd' && department !== 'vu') && (
                            <div className="sm:col-span-2 space-y-1.5" data-field="external_os_number">
                                <Label htmlFor="external_os_number" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Nº OS Concessionária <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="external_os_number"
                                    {...register('external_os_number')}
                                    placeholder="Ex: 12345"
                                />
                            </div>
                        )}
                    </div>

                    {/* Row: Placa / Modelo / Cor */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5" data-field="plate">
                            <Label htmlFor="plate" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Placa / Chassi <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="plate"
                                {...(() => {
                                    const { ref: registerRef, ...rest } = register('plate');
                                    return {
                                        ...rest,
                                        ref: (el: HTMLInputElement | null) => {
                                            registerRef(el);
                                            plateInputRef.current = el;
                                        },
                                    };
                                })()}
                                onChange={(e) =>
                                    setValue('plate', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''), {
                                        shouldValidate: true,
                                    })
                                }
                                placeholder="ABC1D23 ou chassi"
                                maxLength={17}
                                className={cn('font-mono tracking-widest uppercase', errors.plate && 'border-destructive')}
                                aria-invalid={!!errors.plate}
                            />
                            {errors.plate && (
                                <p className="text-xs text-destructive">{errors.plate.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5" data-field="vehicle_model">
                            <Label htmlFor="vehicle_model" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Modelo <span className="text-destructive">*</span>
                            </Label>
                            {department === 'vu' ? (
                                <Input
                                    id="vehicle_model"
                                    value={watch('vehicle_model')}
                                    onChange={(e) => {
                                        setValue('vehicle_model', e.target.value, { shouldValidate: true });
                                        setValue('vehicle_model_id', undefined);
                                    }}
                                    placeholder="Digite o modelo..."
                                    className={cn('h-10', errors.vehicle_model && 'border-destructive')}
                                />
                            ) : modelsLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <Select
                                    value={watch('vehicle_model')}
                                    onValueChange={(v) => {
                                        setValue('vehicle_model', v, { shouldValidate: true });
                                        const selected = (vehicleModels ?? []).find((m) => m.name === v);
                                        setValue('vehicle_model_id', selected?.id ?? undefined);
                                    }}
                                >
                                    <SelectTrigger
                                        id="vehicle_model"
                                        className={cn(errors.vehicle_model && 'border-destructive')}
                                    >
                                        <SelectValue placeholder="Selecionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(vehicleModels ?? []).map((m) => (
                                            <SelectItem key={m.id} value={m.name}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {errors.vehicle_model && (
                                <p className="text-xs text-destructive">{errors.vehicle_model.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="vehicle_color" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Cor
                            </Label>
                            <Input
                                id="vehicle_color"
                                {...register('vehicle_color')}
                                placeholder="Branco"
                            />
                        </div>
                    </div>

                    {/* Consultor */}
                    <div className="space-y-1.5">
                        <Label htmlFor="consultant_id" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Consultor
                        </Label>
                        {consultantsLoading ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <Select
                                value={watch('consultant_id')?.toString() ?? ''}
                                onValueChange={(v) =>
                                    setValue('consultant_id', v ? Number(v) : undefined, {
                                        shouldValidate: true,
                                    })
                                }
                            >
                                <SelectTrigger id="consultant_id">
                                    <SelectValue placeholder="Selecionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {consultants.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Serviços / Películas */}
                    {(department === 'film' || department === 'ppf')
                        ? (
                            <div data-field="film_entries">
                                <FilmPicker
                                    storeId={storeId ?? 0}
                                    brandId={storeBrandId}
                                    department={department}
                                    selectedEntries={watch('film_entries') ?? [{ service_id: 0, tonality: '', roll_code: '' }]}
                                    onChange={(entries) => setValue('film_entries', entries)}
                                    installers={watch('installers') ?? []}
                                    onInstallersChange={(ids) => setValue('installers', ids)}
                                    error={errors.film_entries?.message}
                                    rollCodeErrors={
                                        Array.isArray(errors.film_entries)
                                            ? Object.fromEntries(
                                                (errors.film_entries as Array<{ roll_code?: { message?: string } } | undefined>)
                                                    .map((e, i) => [i, e?.roll_code?.message])
                                                    .filter(([, msg]) => msg != null) as [number, string][]
                                              )
                                            : undefined
                                    }
                                />
                            </div>
                        )
                        : (
                            <div data-field="selected_services">
                                <ServicePicker
                                    department={department}
                                    brandId={storeBrandId}
                                    selectedIds={selectedSvcs}
                                    onChange={(ids) => setValue('selected_services', ids, { shouldValidate: true })}
                                    error={errors.selected_services?.message}
                                />
                            </div>
                        )
                    }

                    {/* Fotos */}
                    <div className="flex flex-wrap gap-6">
                        <CompactPhotoUploader photos={photos} onChange={setPhotos} label="Foto da OS" />
                        <CompactPhotoUploader photos={damagePhotos} onChange={setDamagePhotos} label="Foto de Avaria" />
                    </div>

                    {/* Observações */}
                    <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Observações
                        </Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Informações adicionais..."
                            rows={2}
                            className="resize-none bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
                        />
                    </div>
                </form>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50/80 dark:bg-zinc-900/50">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onSave}
                        disabled={isBusy}
                        className="border-[#F5A800] text-[#E89200] hover:bg-[#F5A800]/10"
                    >
                        {isBusy ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                        type="button"
                        onClick={onSaveAndNext}
                        disabled={isBusy}
                        className="bg-[#F5A800] hover:bg-[#E89200] text-[#111111] font-semibold gap-1.5"
                    >
                        {isBusy ? 'Salvando...' : (
                            <>
                                Salvar e Próxima
                                <ChevronRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
