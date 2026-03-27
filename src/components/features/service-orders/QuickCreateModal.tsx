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

function isValidPlateOrChassi(value: string): boolean {
    const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return PLATE_MERCOSUL.test(v) || PLATE_OLD.test(v) || CHASSI_VIN.test(v);
}

// ─── Zod schema ───────────────────────────────────────────────────────────────
const schema = z.object({
    department: z.enum(['film', 'ppf', 'vn', 'vu', 'bodywork', 'workshop'] as const, {
        error: 'Selecione um departamento',
    }),
    plate: z
        .string()
        .min(1, 'Placa ou chassi obrigatório')
        .refine((v) => isValidPlateOrChassi(v), 'Formato inválido. Use placa (ex: ABC1D23) ou chassi (17 caracteres)'),
    vehicle_model: z.string().min(1, 'Modelo obrigatório'),
    vehicle_color: z.string().optional(),
    consultant_id: z.number().optional(),
    external_os_number: z.string().optional(),
    selected_services: z.array(z.number()).default([]),
    is_return: z.boolean().default(false),
    is_courtesy: z.boolean().default(false),
    notes: z.string().optional(),
    service_date: z.string().min(1, 'Data do serviço obrigatória'),
    film_entries: z.array(z.object({
        service_id: z.number(),
        tonality:   z.string(),
        roll_code:  z.string().optional(),
    })).optional(),
    installers: z.array(z.number()).optional(),
    destination_store_id: z.number().optional(),
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
    { value: 'vu',       label: 'VU' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'workshop', label: 'Oficina' },
];

// ─── Sub-component: department toggle buttons ─────────────────────────────────
interface DeptToggleProps {
    value: Department | undefined;
    onChange: (v: Department) => void;
    error?: string;
}

function DeptToggle({ value, onChange, error }: DeptToggleProps) {
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
                                ? 'bg-aems-primary-400 border-aems-primary-400 text-aems-neutral-900'
                                : 'border-aems-neutral-200 text-aems-neutral-600 hover:bg-aems-neutral-50 hover:border-aems-neutral-300'
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
interface ServicePickerProps {
    department: Department | undefined;
    brand?: string;
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    error?: string;
}

function ServicePicker({ department, brand, selectedIds, onChange, error }: ServicePickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const { data: services, isLoading } = useServices(department, brand);

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
interface FilmEntry {
    service_id: number;
    tonality: string;
    roll_code?: string;
}

interface FilmPickerProps {
    storeId: number;
    brand?: string;
    department: 'film' | 'ppf';
    selectedEntries: FilmEntry[];
    onChange: (entries: FilmEntry[]) => void;
    installers: number[];
    onInstallersChange: (ids: number[]) => void;
    error?: string;
}

function FilmPicker({
    storeId: _storeId,
    brand,
    department,
    selectedEntries,
    onChange,
    installers,
    onInstallersChange,
    error,
}: FilmPickerProps) {
    const { data: services, isLoading: servicesLoading } = useServices(department, brand);
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
                Películas <span className="text-destructive">*</span>
            </Label>

            <div className="space-y-2">
                {selectedEntries.map((entry, index) => (
                    <div
                        key={index}
                        className="border border-aems-neutral-200 rounded-lg p-3 space-y-2 bg-aems-neutral-50/30"
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

                            <Input
                                value={entry.roll_code ?? ''}
                                onChange={(e) => updateEntry(index, 'roll_code', e.target.value)}
                                placeholder="Código do Rolo (opcional)"
                                className="h-10"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addEntry}
                className="text-sm font-medium text-aems-primary-600 hover:text-aems-primary-700 transition-colors"
            >
                + Adicionar Película
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
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {employees.map((emp: { id: number; name: string }) => (
                            <label
                                key={emp.id}
                                className="flex items-center gap-2 cursor-pointer select-none"
                            >
                                <Checkbox
                                    checked={installers.includes(emp.id)}
                                    onCheckedChange={() => toggleInstaller(emp.id)}
                                    id={`installer-${emp.id}`}
                                />
                                <span className="text-sm">{emp.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Sub-component: camera photo capture ──────────────────────────────────────
interface CompactPhotoUploaderProps {
    photos: Photo[];
    onChange: (photos: Photo[]) => void;
}

function CompactPhotoUploader({ photos, onChange }: CompactPhotoUploaderProps) {
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
                Foto da OS
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-aems-neutral-200 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
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
                            alt="Foto da OS"
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
    const { availableStores, selectedStoreId } = useStoreStore();
    const createServiceOrder = useCreateServiceOrder();

    const [photos, setPhotos] = useState<Photo[]>([]);
    const plateInputRef = useRef<HTMLInputElement>(null);

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
            vehicle_color: '',
            consultant_id: undefined,
            external_os_number: '',
            selected_services: [],
            is_return: false,
            is_courtesy: false,
            notes: '',
            service_date: new Date().toISOString().split('T')[0],
            film_entries: [],
            installers: [],
            destination_store_id: undefined,
        },
    });

    const department   = watch('department');
    const selectedSvcs = watch('selected_services');
    const isReturn     = watch('is_return');
    const isCourtesy   = watch('is_courtesy');

    // Resolve loja e marca atuais
    const storeId = selectedStoreId ?? user?.store_id ?? undefined;
    const currentStore = availableStores.find((s) => s.id === storeId);
    const isWarehouse = currentStore?.store_type === 'warehouse';
    const storeBrand = currentStore?.dealership_brand ?? undefined;
    const { consultants, isLoading: consultantsLoading } = useConsultants(
        storeId ? { store_id: storeId, is_active: true } : undefined
    );

    // Vehicle models
    const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(
        storeId ? { store_id: storeId, active_only: true } : {}
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
        onClose();
    }, [reset, onClose]);

    // Full reset: clear form and stay open for next OS
    const fullReset = useCallback(() => {
        reset({
            department: undefined,
            plate: '',
            vehicle_model: '',
            vehicle_color: '',
            consultant_id: undefined,
            external_os_number: '',
            selected_services: [],
            is_return: false,
            is_courtesy: false,
            notes: '',
            service_date: new Date().toISOString().split('T')[0],
            film_entries: [],
            installers: [],
            destination_store_id: undefined,
        });
        setPhotos([]);
        setTimeout(() => plateInputRef.current?.focus(), 50);
    }, [reset]);

    // Partial reset: keep dept, consultant, os_number — for "Salvar e Próxima"
    const partialReset = useCallback(
        (savedDept: Department | undefined, savedConsultant: number | undefined, savedOsNumber: string | undefined, savedDestStore: number | undefined) => {
            reset({
                department: savedDept,
                plate: '',
                vehicle_model: '',
                vehicle_color: '',
                consultant_id: savedConsultant,
                external_os_number: savedOsNumber,
                selected_services: [],
                is_return: false,
                is_courtesy: false,
                notes: '',
                service_date: new Date().toISOString().split('T')[0],
                film_entries: (savedDept === 'film' || savedDept === 'ppf') ? [{ service_id: 0, tonality: '', roll_code: '' }] : [],
                installers: [],
                destination_store_id: savedDestStore,
            });
            setPhotos([]);
            setTimeout(() => plateInputRef.current?.focus(), 50);
        },
        [reset]
    );

    const buildPayload = useCallback(
        (data: QuickCreateFormData, uploadedPhotoUrls: string[]) => {
            const notesText = [
                data.notes || '',
                data.is_courtesy ? '[CORTESIA]' : '',
            ]
                .filter(Boolean)
                .join(' | ');

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
                vehicle_plate: data.plate.toUpperCase(),
                vehicle_model: data.vehicle_model,
                vehicle_color: data.vehicle_color || undefined,
                department: data.department,
                store_id: storeId ?? 0,
                dealership_id: currentStore?.dealership_id || undefined,
                consultant_id: data.consultant_id || undefined,
                external_os_number: data.external_os_number || undefined,
                destination_store_id: data.destination_store_id || undefined,
                items,
                workers,
                notes: notesText || undefined,
                photos: uploadedPhotoUrls,
                service_date: data.service_date,
            };
        },
        [storeId, currentStore]
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

    const onSave = handleSubmit(async (rawData) => {
        const data = rawData as QuickCreateFormData;
        if (isWarehouse && !data.destination_store_id) {
            toast({ variant: 'destructive', title: 'Selecione a loja de destino' });
            return;
        }
        try {
            const uploadedUrls = await uploadPhotos();
            await createServiceOrder.mutateAsync(buildPayload(data, uploadedUrls));
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
    });

    const onSaveAndNext = handleSubmit(async (rawData) => {
        const data = rawData as QuickCreateFormData;
        if (isWarehouse && !data.destination_store_id) {
            toast({ variant: 'destructive', title: 'Selecione a loja de destino' });
            return;
        }
        const savedDept      = data.department;
        const savedConsultant = data.consultant_id;
        const savedOsNumber  = data.external_os_number;
        const savedDestStore = data.destination_store_id;

        try {
            const uploadedUrls = await uploadPhotos();
            await createServiceOrder.mutateAsync(buildPayload(data, uploadedUrls));
            toast({ title: 'OS lançada! Próxima OS...' });
            partialReset(savedDept, savedConsultant, savedOsNumber, savedDestStore);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Verifique os dados e tente novamente.';
            toast({ variant: 'destructive', title: 'Erro ao lançar OS', description: msg });
        }
    });

    const isBusy = isSubmitting || createServiceOrder.isPending;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button:last-child]:hidden"
                aria-describedby={undefined}
            >
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-lg font-bold">Lançar OS</DialogTitle>
                </DialogHeader>

                <form className="px-6 py-4 space-y-5" onSubmit={(e) => e.preventDefault()}>
                    {/* Departamento */}
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

                    {/* Data do Serviço */}
                    <div className="space-y-1.5">
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

                    {/* Row: Placa / Modelo / Cor */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
                            <Label htmlFor="vehicle_model" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Modelo <span className="text-destructive">*</span>
                            </Label>
                            {modelsLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <Select
                                    value={watch('vehicle_model')}
                                    onValueChange={(v) => setValue('vehicle_model', v, { shouldValidate: true })}
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

                    {/* Loja de Destino (apenas Galpão) */}
                    {isWarehouse && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Loja de Destino <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={watch('destination_store_id')?.toString() ?? ''}
                                onValueChange={(v) =>
                                    setValue('destination_store_id', v ? Number(v) : undefined, { shouldValidate: true })
                                }
                            >
                                <SelectTrigger className={cn(!watch('destination_store_id') && errors.destination_store_id && 'border-destructive')}>
                                    <SelectValue placeholder="Selecionar loja de destino..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableStores
                                        .filter((s) => s.id !== storeId)
                                        .map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {errors.destination_store_id && (
                                <p className="text-xs text-destructive">{errors.destination_store_id.message}</p>
                            )}
                        </div>
                    )}

                    {/* Row: Consultor / Nº OS Concessionária */}
                    <div className="grid grid-cols-2 gap-3">
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

                        <div className="space-y-1.5">
                            <Label htmlFor="external_os_number" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Nº OS Concessionária
                            </Label>
                            <Input
                                id="external_os_number"
                                {...register('external_os_number')}
                                placeholder="Ex: 12345"
                            />
                        </div>
                    </div>

                    {/* Serviços / Películas */}
                    {(department === 'film' || department === 'ppf')
                        ? (
                            <FilmPicker
                                storeId={storeId ?? 0}
                                brand={storeBrand}
                                department={department}
                                selectedEntries={watch('film_entries') ?? [{ service_id: 0, tonality: '', roll_code: '' }]}
                                onChange={(entries) => setValue('film_entries', entries)}
                                installers={watch('installers') ?? []}
                                onInstallersChange={(ids) => setValue('installers', ids)}
                                error={errors.film_entries?.message}
                            />
                        )
                        : (
                            <ServicePicker
                                department={department}
                                brand={storeBrand}
                                selectedIds={selectedSvcs}
                                onChange={(ids) => setValue('selected_services', ids, { shouldValidate: true })}
                                error={errors.selected_services?.message}
                            />
                        )
                    }

                    {/* Fotos */}
                    <CompactPhotoUploader photos={photos} onChange={setPhotos} />

                    {/* Checkboxes + OBS */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-6">
                            <label htmlFor="is_return" className="flex items-center gap-2 cursor-pointer select-none">
                                <Checkbox
                                    checked={isReturn}
                                    onCheckedChange={(v) => setValue('is_return', Boolean(v))}
                                    id="is_return"
                                />
                                <span className="text-sm font-medium">Retorno</span>
                            </label>
                            <label htmlFor="is_courtesy" className="flex items-center gap-2 cursor-pointer select-none">
                                <Checkbox
                                    checked={isCourtesy}
                                    onCheckedChange={(v) => setValue('is_courtesy', Boolean(v))}
                                    id="is_courtesy"
                                />
                                <span className="text-sm font-medium">Cortesia</span>
                            </label>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Observações
                            </Label>
                            <Textarea
                                id="notes"
                                {...register('notes')}
                                placeholder="Informações adicionais..."
                                rows={2}
                                className="resize-none"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-aems-neutral-50/50">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onSave}
                        disabled={isBusy}
                        className="border-aems-primary-400 text-aems-primary-600 hover:bg-aems-primary-50"
                    >
                        {isBusy ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                        type="button"
                        onClick={onSaveAndNext}
                        disabled={isBusy}
                        className="bg-aems-primary-400 hover:bg-aems-primary-500 text-aems-neutral-900 font-semibold gap-1.5"
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
