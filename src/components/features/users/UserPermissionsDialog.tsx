import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Eye, Pencil, ShieldCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPermissions, useUpdateUserPermissions } from '@/hooks/useUserPermissions';
import { storesService } from '@/services/api/stores.service';
import { MODULE_GROUPS } from '@/constants/user-permissions';
import type { ModulePermissionItem } from '@/types/user.types';
import type { User } from '@/types/user.types';
import type { Store } from '@/services/api/stores.service';

interface Props {
    user: User | null;
    open: boolean;
    onClose: () => void;
}

type PermMap = Record<string, { can_view: boolean; can_edit: boolean }>;

const BRAND_LABELS: Record<string, string> = {
    byd: 'BYD',
    fiat: 'FIAT',
    hyundai: 'HYUNDAI',
    toyota: 'TOYOTA',
    outros: 'OUTROS',
};

// Brand header colors
const BRAND_COLORS: Record<string, { header: string; chevron: string; label: string }> = {
    byd:     { header: 'bg-green-50',  chevron: 'text-green-600',  label: 'text-green-800' },
    fiat:    { header: 'bg-blue-50',   chevron: 'text-blue-600',   label: 'text-blue-800' },
    hyundai: { header: 'bg-sky-50',    chevron: 'text-sky-600',    label: 'text-sky-800' },
    toyota:  { header: 'bg-red-50',    chevron: 'text-red-600',    label: 'text-red-800' },
    outros:  { header: 'bg-gray-50',   chevron: 'text-gray-500',   label: 'text-gray-700' },
};

function getBrandColor(brand: string) {
    return BRAND_COLORS[brand] ?? BRAND_COLORS['outros'];
}

export function UserPermissionsDialog({ user, open, onClose }: Props) {
    const userId = open && user ? user.id : null;
    const queryClient = useQueryClient();

    const { data: permissions, isLoading: permissionsLoading } = useUserPermissions(userId);
    const { data: allStores = [], isLoading: storesLoading } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
        staleTime: 1000 * 60 * 60,
    });

    const updateMutation = useUpdateUserPermissions();

    // Local state: module permissions map
    const [modulePerms, setModulePerms] = useState<PermMap>({});
    // Local state: accessible store IDs
    const [accessibleStoreIds, setAccessibleStoreIds] = useState<Set<number>>(new Set());
    // Collapsed state for module groups (left panel)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['admin', 'operational', 'manager']));
    // Collapsed state for brands (right panel)
    const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

    // Populate local state when permissions load
    useEffect(() => {
        if (!permissions) return;
        const map: PermMap = {};
        for (const p of permissions.module_permissions) {
            map[p.module] = { can_view: p.can_view, can_edit: p.can_edit };
        }
        setModulePerms(map);
        setAccessibleStoreIds(new Set(permissions.accessible_store_ids));
    }, [permissions]);

    // Reset expanded brands when stores load
    useEffect(() => {
        if (allStores.length > 0) {
            const brands = new Set(allStores.map((s) => s.dealership_brand ?? 'outros'));
            setExpandedBrands(brands);
        }
    }, [allStores]);

    const toggleGroup = useCallback((key: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) { next.delete(key); } else { next.add(key); }
            return next;
        });
    }, []);

    const toggleBrand = useCallback((brand: string) => {
        setExpandedBrands((prev) => {
            const next = new Set(prev);
            if (next.has(brand)) { next.delete(brand); } else { next.add(brand); }
            return next;
        });
    }, []);

    const setModulePerm = useCallback((module: string, field: 'can_view' | 'can_edit', value: boolean) => {
        setModulePerms((prev) => ({
            ...prev,
            [module]: { ...(prev[module] ?? { can_view: false, can_edit: false }), [field]: value },
        }));
    }, []);

    const isGroupAllChecked = useCallback((moduleKeys: string[]) =>
        moduleKeys.length > 0 && moduleKeys.every((m) => modulePerms[m]?.can_view && modulePerms[m]?.can_edit),
    [modulePerms]);

    const isGroupIndeterminate = useCallback((moduleKeys: string[]) => {
        const anyChecked = moduleKeys.some((m) => modulePerms[m]?.can_view || modulePerms[m]?.can_edit);
        const allChecked = moduleKeys.every((m) => modulePerms[m]?.can_view && modulePerms[m]?.can_edit);
        return anyChecked && !allChecked;
    }, [modulePerms]);

    const toggleGroupAll = useCallback((moduleKeys: string[], value: boolean) => {
        setModulePerms((prev) => {
            const next = { ...prev };
            for (const m of moduleKeys) {
                next[m] = { can_view: value, can_edit: value };
            }
            return next;
        });
    }, []);

    const getStoresByBrand = useCallback((brand: string): Store[] =>
        allStores.filter((s) => (s.dealership_brand ?? 'outros') === brand),
    [allStores]);

    const isBrandAllChecked = useCallback((brand: string): boolean => {
        const bs = getStoresByBrand(brand);
        return bs.length > 0 && bs.every((s) => accessibleStoreIds.has(s.id));
    }, [getStoresByBrand, accessibleStoreIds]);

    const isBrandIndeterminate = useCallback((brand: string): boolean => {
        const bs = getStoresByBrand(brand);
        const anyChecked = bs.some((s) => accessibleStoreIds.has(s.id));
        const allChecked = bs.length > 0 && bs.every((s) => accessibleStoreIds.has(s.id));
        return anyChecked && !allChecked;
    }, [getStoresByBrand, accessibleStoreIds]);

    const toggleBrandAll = useCallback((brand: string, value: boolean) => {
        setAccessibleStoreIds((prev) => {
            const next = new Set(prev);
            for (const s of getStoresByBrand(brand)) {
                if (value) { next.add(s.id); } else { next.delete(s.id); }
            }
            return next;
        });
    }, [getStoresByBrand]);

    const toggleStore = useCallback((storeId: number) => {
        setAccessibleStoreIds((prev) => {
            const next = new Set(prev);
            if (next.has(storeId)) { next.delete(storeId); } else { next.add(storeId); }
            return next;
        });
    }, []);

    const handleSave = async () => {
        if (!user) return;
        const module_permissions: ModulePermissionItem[] = Object.entries(modulePerms).map(
            ([module, p]) => ({ module, can_view: p.can_view, can_edit: p.can_edit })
        );
        await updateMutation.mutateAsync({
            userId: user.id,
            data: { module_permissions, accessible_store_ids: Array.from(accessibleStoreIds) },
        });
        // Invalida o cache de permissões do usuário editado (caso ele esteja logado)
        queryClient.invalidateQueries({ queryKey: ['my-permissions', user.id] });
        onClose();
    };

    // Group all stores by brand
    const storesByBrand: Record<string, Store[]> = {};
    for (const s of allStores) {
        const brand = s.dealership_brand ?? 'outros';
        if (!storesByBrand[brand]) storesByBrand[brand] = [];
        storesByBrand[brand].push(s);
    }

    const isLoading = permissionsLoading || storesLoading;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <DialogTitle className="text-lg font-bold">
                            Permissões{user ? ` · ${user.full_name}` : ''}
                        </DialogTitle>
                    </div>
                    {user && (
                        <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                    )}
                </DialogHeader>

                {/* Body */}
                {isLoading ? (
                    <div className="p-6 space-y-3 flex-1">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-1/2" />
                    </div>
                ) : (
                    <div className="flex flex-1 overflow-hidden divide-x min-h-0">
                        {/* LEFT PANEL — Module Permissions */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
                                Permissões por Módulo
                            </p>

                            {/* Column headers */}
                            <div className="flex items-center px-4 pb-1">
                                <span className="flex-1" />
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground w-10 justify-center">
                                        <Eye className="h-3 w-3" />
                                        Ver
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground w-10 justify-center">
                                        <Pencil className="h-3 w-3" />
                                        Editar
                                    </span>
                                </div>
                            </div>

                            {MODULE_GROUPS.map((group) => {
                                const isExpanded = expandedGroups.has(group.key);
                                const moduleKeys = group.modules.map((m) => m.key);
                                const allChecked = isGroupAllChecked(moduleKeys);
                                const indeterminate = isGroupIndeterminate(moduleKeys);

                                return (
                                    <div key={group.key} className="rounded-lg border overflow-hidden">
                                        {/* Group header row */}
                                        <div
                                            className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => toggleGroup(group.key)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleGroup(group.key); }}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <span className="shrink-0 text-muted-foreground">
                                                {isExpanded
                                                    ? <ChevronDown className="h-4 w-4" />
                                                    : <ChevronRight className="h-4 w-4" />}
                                            </span>
                                            <span className="flex-1 text-sm font-bold uppercase tracking-wide">
                                                {group.label}
                                            </span>
                                            {/* Group "select all" checkbox */}
                                            <div
                                                className="flex items-center gap-4 shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.stopPropagation()}
                                                role="presentation"
                                            >
                                                <div className="w-10 flex justify-center">
                                                    <Checkbox
                                                        checked={indeterminate ? 'indeterminate' : allChecked}
                                                        onCheckedChange={(v) => toggleGroupAll(moduleKeys, Boolean(v))}
                                                        aria-label={`Selecionar todos os módulos de ${group.label}`}
                                                    />
                                                </div>
                                                {/* Spacer for the edit column */}
                                                <div className="w-10" />
                                            </div>
                                        </div>

                                        {/* Module rows */}
                                        {isExpanded && (
                                            <div className="divide-y">
                                                {group.modules.map((mod) => {
                                                    const perm = modulePerms[mod.key] ?? { can_view: false, can_edit: false };
                                                    return (
                                                        <div
                                                            key={mod.key}
                                                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                                                        >
                                                            <span className="flex-1 text-sm text-foreground">
                                                                {mod.label}
                                                            </span>
                                                            <div className="flex items-center gap-4 shrink-0">
                                                                <div className="w-10 flex justify-center">
                                                                    <Checkbox
                                                                        checked={perm.can_view}
                                                                        onCheckedChange={(v) =>
                                                                            setModulePerm(mod.key, 'can_view', Boolean(v))
                                                                        }
                                                                        aria-label={`Visualizar ${mod.label}`}
                                                                    />
                                                                </div>
                                                                <div className="w-10 flex justify-center">
                                                                    <Checkbox
                                                                        checked={perm.can_edit}
                                                                        onCheckedChange={(v) =>
                                                                            setModulePerm(mod.key, 'can_edit', Boolean(v))
                                                                        }
                                                                        aria-label={`Editar ${mod.label}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT PANEL — Store Access */}
                        <div className="w-72 shrink-0 overflow-y-auto p-4 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
                                Acesso por Loja
                            </p>

                            {Object.keys(storesByBrand).length === 0 ? (
                                <p className="text-sm text-muted-foreground px-1">Nenhuma loja cadastrada.</p>
                            ) : (
                                Object.entries(storesByBrand).map(([brand, brandStoreList]) => {
                                    const isExpanded = expandedBrands.has(brand);
                                    const allChecked = isBrandAllChecked(brand);
                                    const indeterminate = isBrandIndeterminate(brand);
                                    const colors = getBrandColor(brand);

                                    return (
                                        <div key={brand} className="rounded-lg border overflow-hidden">
                                            {/* Brand header */}
                                            <div
                                                className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none hover:brightness-95 transition-all ${colors.header}`}
                                                onClick={() => toggleBrand(brand)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleBrand(brand); }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <span className={`shrink-0 ${colors.chevron}`}>
                                                    {isExpanded
                                                        ? <ChevronDown className="h-4 w-4" />
                                                        : <ChevronRight className="h-4 w-4" />}
                                                </span>
                                                <span className={`flex-1 text-sm font-bold ${colors.label}`}>
                                                    {BRAND_LABELS[brand] ?? brand.toUpperCase()}
                                                    <span className="ml-1.5 text-xs font-normal opacity-60">
                                                        ({brandStoreList.length})
                                                    </span>
                                                </span>
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                    role="presentation"
                                                >
                                                    <Checkbox
                                                        checked={indeterminate ? 'indeterminate' : allChecked}
                                                        onCheckedChange={(v) => toggleBrandAll(brand, Boolean(v))}
                                                        aria-label={`Selecionar todas as lojas ${BRAND_LABELS[brand] ?? brand}`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Store rows */}
                                            {isExpanded && (
                                                <div className="divide-y">
                                                    {brandStoreList.map((store) => (
                                                        <div
                                                            key={store.id}
                                                            className="flex items-center gap-2 px-4 py-2 hover:bg-muted/30 cursor-pointer transition-colors"
                                                            onClick={() => toggleStore(store.id)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleStore(store.id); }}
                                                            role="checkbox"
                                                            aria-checked={accessibleStoreIds.has(store.id)}
                                                            tabIndex={0}
                                                        >
                                                            <span className="flex-1 text-xs text-foreground leading-tight">
                                                                {store.name}
                                                                {store.code && (
                                                                    <span className="ml-1 text-muted-foreground">
                                                                        ({store.code})
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <Checkbox
                                                                checked={accessibleStoreIds.has(store.id)}
                                                                onCheckedChange={() => toggleStore(store.id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                aria-label={`Acesso à loja ${store.name}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0 sm:justify-between">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        {Array.from(accessibleStoreIds).length} loja(s) selecionada(s)
                    </p>
                    <div className="flex gap-2 sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={updateMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={updateMutation.isPending || isLoading}
                        >
                            {updateMutation.isPending ? 'Salvando...' : 'Salvar Permissões'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
