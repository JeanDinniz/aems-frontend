import { Link, useLocation } from 'react-router-dom';
import {
    ClipboardList, Settings, X,
    UserCog,
    Contact, HardHat, Wrench, Store, ChevronRight, Car,
    ClipboardCheck, FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type UserRole = 'owner' | 'supervisor' | 'operator';

interface SidebarItem {
    icon: typeof ClipboardList;
    label: string;
    href: string;
    roles?: UserRole[];
    /** Chave do módulo em MODULE_GROUPS. Se definida, filtra por can_view. */
    moduleKey?: string;
}

interface SidebarGroup {
    label: string;
    roles?: UserRole[];
    items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
    {
        label: 'Operacional',
        items: [
            { icon: ClipboardList,    label: 'Ordens de Serviço', href: '/service-orders', moduleKey: 'service_orders' },
            { icon: ClipboardCheck,   label: 'Conferência',       href: '/conference',     moduleKey: 'conference' },
            { icon: FileSpreadsheet,  label: 'Fechamento',        href: '/fechamento',     moduleKey: 'fechamento' },
        ],
    },
    {
        label: 'Administração',
        roles: ['owner'],
        items: [
            { icon: UserCog, label: 'Usuários',    href: '/admin/users',       moduleKey: 'users' },
            { icon: HardHat, label: 'Funcionários', href: '/admin/employees',  moduleKey: 'employees' },
            { icon: Contact, label: 'Consultores',  href: '/admin/consultants', moduleKey: 'consultants' },
            { icon: Store,   label: 'Lojas',        href: '/admin/stores',     moduleKey: 'stores' },
            { icon: Wrench,  label: 'Serviços',     href: '/servicos',         moduleKey: 'services' },
            { icon: Car,     label: 'Modelos',      href: '/admin/modelos',    moduleKey: 'vehicle_models' },
        ],
    },
    {
        label: 'Sistema',
        items: [
            { icon: Settings, label: 'Configurações', href: '/settings' },
        ],
    },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const { user } = useAuth();
    const { data: myPermissions } = useMyPermissions();
    const isOwner = user?.role === 'owner';

    const isActive = (href: string) =>
        location.pathname.startsWith(href);

    /** Owner vê tudo. Para outros, verifica can_view. Sem moduleKey = sempre visível. */
    const canViewItem = (item: SidebarItem): boolean => {
        if (!item.moduleKey || isOwner) return true;
        if (!myPermissions) return true; // padrão enquanto carrega
        const perm = myPermissions.module_permissions.find((p) => p.module === item.moduleKey);
        return perm?.can_view ?? true;
    };

    const visibleGroups = sidebarGroups.filter(
        (g) => !g.roles || (user?.role && g.roles.includes(user.role as UserRole))
    );

    return (
        <TooltipProvider delayDuration={300}>
            <>
                {/* Mobile Overlay */}
                <div
                    className={cn(
                        'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-200',
                        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    )}
                    onClick={onClose}
                    onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
                    role="button"
                    tabIndex={isOpen ? 0 : -1}
                    aria-label="Fechar menu"
                />

                {/* Sidebar */}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col',
                        'bg-gradient-to-b from-[#0C111D] to-[#141B2D]',
                        'border-r border-white/5 shadow-2xl',
                        'transform transition-transform duration-200 ease-in-out',
                        'md:translate-x-0 md:static md:h-full',
                        isOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    {/* ── Logo ── */}
                    <div className="flex h-16 items-center justify-between px-5 border-b border-white/5 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aems-primary-400 to-aems-primary-600 flex items-center justify-center shadow-[0_0_16px_rgba(252,175,22,0.35)]">
                                    <span className="font-black text-white text-xs tracking-tight">AE</span>
                                </div>
                                {/* glow dot */}
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-aems-success border-2 border-[#0C111D]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white text-sm leading-tight tracking-wide">AEMS</span>
                                <span className="text-[10px] text-aems-neutral-400 leading-none">
                                    {user?.role === 'owner'
                                        ? 'Owner'
                                        : user?.role === 'supervisor'
                                        ? 'Supervisor'
                                        : `Unidade ${user?.store_id ?? ''}`}
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden text-aems-neutral-400 hover:text-white hover:bg-white/5 h-8 w-8"
                            onClick={onClose}
                            aria-label="Fechar menu"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* ── Nav ── */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 aems-scroll">
                        {visibleGroups.map((group) => {
                            const visibleItems = group.items.filter(
                                (item) =>
                                    (!item.roles || (user?.role && item.roles.includes(user.role as UserRole))) &&
                                    canViewItem(item)
                            );
                            if (!visibleItems.length) return null;

                            return (
                                <div key={group.label}>
                                    {/* Group label */}
                                    <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-aems-neutral-500 select-none">
                                        {group.label}
                                    </p>

                                    <div className="space-y-0.5">
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.href);

                                            return (
                                                <Tooltip key={item.href}>
                                                    <TooltipTrigger asChild>
                                                        <Link
                                                            to={item.href}
                                                            onClick={onClose}
                                                            className={cn(
                                                                'group relative flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                                                                active
                                                                    ? 'text-aems-primary-400 bg-aems-primary-400/10'
                                                                    : 'text-aems-neutral-300 hover:text-white hover:bg-white/5'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                {/* Active indicator bar */}
                                                                {active && (
                                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-aems-primary-400 shadow-[0_0_8px_rgba(252,175,22,0.5)]" />
                                                                )}
                                                                <Icon
                                                                    className={cn(
                                                                        'h-4 w-4 flex-shrink-0 transition-colors',
                                                                        active
                                                                            ? 'text-aems-primary-400'
                                                                            : 'text-aems-neutral-500 group-hover:text-aems-neutral-300'
                                                                    )}
                                                                />
                                                                <span className="truncate leading-none">{item.label}</span>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {/* Chevron sutil no hover */}
                                                                {!active && (
                                                                    <ChevronRight className="h-3 w-3 text-aems-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="text-xs">
                                                        {item.label}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    {/* ── Footer ── */}
                    <div className="flex-shrink-0 px-4 py-3 border-t border-white/5">
                        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/3 hover:bg-white/5 transition-colors cursor-default">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-aems-primary-400 to-aems-primary-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-white">
                                    {user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate leading-tight">
                                    {user?.full_name ?? 'Usuário'}
                                </p>
                                <p className="text-[10px] text-aems-neutral-400 truncate leading-none">
                                    {user?.email ?? ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </>
        </TooltipProvider>
    );
}
