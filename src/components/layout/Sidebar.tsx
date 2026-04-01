import { Link, useLocation } from 'react-router-dom';
import {
    ClipboardList, Settings, X,
    UserCog,
    Contact, HardHat, Wrench, Store, Car, Tag,
    ClipboardCheck, FileSpreadsheet, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { useAuthStore } from '@/stores/auth.store';
import { WashCenterLogo } from '@/components/brand/WashCenterLogo';
import type { SubModule } from '@/types/accessProfile.types';

// All possible roles including the new profile-based 'user' role
type AllowedRole = 'owner' | 'supervisor' | 'operator' | 'user';

interface SidebarItem {
    icon: typeof ClipboardList;
    label: string;
    href: string;
    /** If set, only these roles see the item (before permission check). */
    roles?: AllowedRole[];
    /** Sub-module key from the new permissions system. If defined, filters by can_view for non-owners. */
    subModule?: SubModule;
}

interface SidebarGroup {
    label: string;
    /** If set, only these roles see the entire group. */
    roles?: AllowedRole[];
    items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
    {
        label: 'Operacional',
        items: [
            { icon: ClipboardList,    label: 'Ordens de Servico', href: '/service-orders', subModule: 'service_orders' },
            { icon: ClipboardCheck,   label: 'Conferencia',       href: '/conference',     subModule: 'conference' },
            { icon: FileSpreadsheet,  label: 'Fechamento',        href: '/fechamento',     subModule: 'fechamento' },
        ],
    },
    {
        label: 'Administracao',
        roles: ['owner'],
        items: [
            { icon: UserCog,    label: 'Usuarios',         href: '/admin/users',       subModule: 'users' },
            { icon: ShieldCheck,label: 'Perfis de Acesso', href: '/admin/profiles',    subModule: 'profiles' },
            { icon: HardHat,    label: 'Funcionarios',     href: '/admin/employees',   subModule: 'employees' },
            { icon: Contact,    label: 'Consultores',      href: '/admin/consultants', subModule: 'consultants' },
            { icon: Store,      label: 'Lojas',            href: '/admin/stores',      subModule: 'stores' },
            { icon: Wrench,     label: 'Servicos',         href: '/servicos',          subModule: 'services' },
            { icon: Tag,        label: 'Marcas',           href: '/admin/marcas',      subModule: 'brands' },
            { icon: Car,        label: 'Modelos',          href: '/admin/modelos',     subModule: 'models' },
        ],
    },
    {
        label: 'Sistema',
        items: [
            { icon: Settings, label: 'Configuracoes', href: '/settings' },
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
    const hasPermissionFn = useAuthStore((s) => s.hasPermission);
    const isOwnerFn = useAuthStore((s) => s.isOwner);
    // Trigger permissions loading for non-owner users
    useMyPermissions();

    const isActive = (href: string) =>
        location.pathname.startsWith(href);

    /**
     * Owner sees everything.
     * For 'user' role: check effectivePermissions via hasPermission.
     * Items without subModule are always visible (e.g., Settings).
     */
    const canViewItem = (item: SidebarItem): boolean => {
        if (!item.subModule || isOwnerFn()) return true;
        return hasPermissionFn(item.subModule, 'view');
    };

    const visibleGroups = sidebarGroups.filter(
        (g) => !g.roles || (user?.role && g.roles.includes(user.role as AllowedRole))
    );

    const userInitials =
        user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U';

    return (
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
                    'border-r border-[#1E1E1E]',
                    'transform transition-transform duration-200 ease-in-out',
                    'md:translate-x-0 md:static md:h-full'
                )}
                style={{ backgroundColor: '#111111' }}
                aria-label="Navegacao principal"
            >
                {/* Logo */}
                <div
                    className="flex h-16 items-center justify-between px-4 flex-shrink-0 border-b border-[#1E1E1E]"
                    style={{ backgroundColor: '#111111' }}
                >
                    <WashCenterLogo size={28} />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-[#555] hover:text-white hover:bg-[#1E1E1E] h-8 w-8"
                        onClick={onClose}
                        aria-label="Fechar menu"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Nav */}
                <nav
                    className="flex-1 overflow-y-auto px-3 py-2 aems-scroll"
                    style={{ backgroundColor: '#111111' }}
                >
                    {visibleGroups.map((group) => {
                        const visibleItems = group.items.filter(
                            (item) =>
                                (!item.roles || (user?.role && item.roles.includes(user.role as AllowedRole))) &&
                                canViewItem(item)
                        );
                        if (!visibleItems.length) return null;

                        return (
                            <div key={group.label} className="mt-6 first:mt-2">
                                {/* Group label */}
                                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] select-none"
                                   style={{ color: '#3A3A3A' }}>
                                    {group.label}
                                </p>

                                <div className="space-y-0.5">
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);

                                        return (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                onClick={onClose}
                                                className={cn(
                                                    'flex items-center gap-2.5 py-2 rounded-lg text-sm transition-colors',
                                                    active
                                                        ? 'border-l-2 border-[#F5A800] -ml-px pl-[11px] pr-3'
                                                        : 'px-3 hover:bg-[#1E1E1E]'
                                                )}
                                                style={active
                                                    ? { color: '#F5A800', backgroundColor: 'rgba(245,168,0,0.10)' }
                                                    : { color: '#666' }
                                                }
                                                onMouseEnter={(e) => {
                                                    if (!active) {
                                                        (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!active) {
                                                        (e.currentTarget as HTMLAnchorElement).style.color = '#666';
                                                    }
                                                }}
                                                aria-current={active ? 'page' : undefined}
                                            >
                                                <Icon
                                                    className="h-4 w-4 flex-shrink-0"
                                                    style={active ? { color: '#F5A800' } : undefined}
                                                />
                                                <span className="truncate leading-none">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div
                    className="flex-shrink-0 px-4 py-3 border-t border-[#1E1E1E]"
                    style={{ backgroundColor: '#111111' }}
                >
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors cursor-default hover:bg-[#1A1A1A]">
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'rgba(245,168,0,0.20)' }}
                        >
                            <span className="text-[10px] font-bold" style={{ color: '#F5A800' }}>
                                {userInitials}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate leading-tight">
                                {user?.full_name ?? 'Usuario'}
                            </p>
                            <p className="text-[10px] truncate leading-none" style={{ color: '#555' }}>
                                {user?.email ?? ''}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile: slide in */}
            <style>{`
                @media (max-width: 767px) {
                    aside[aria-label="Navegacao principal"] {
                        transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'};
                    }
                }
            `}</style>
        </>
    );
}
