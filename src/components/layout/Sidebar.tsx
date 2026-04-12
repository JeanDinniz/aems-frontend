import { useState } from 'react';
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
import { WashCenterIcon } from '@/components/brand/WashCenterIcon';
import type { SubModule } from '@/types/accessProfile.types';

type AllowedRole = 'owner' | 'user';

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
        items: [
            { icon: UserCog,    label: 'Usuarios',         href: '/admin/users',       subModule: 'users' },
            { icon: ShieldCheck,label: 'Perfis de Acesso', href: '/admin/profiles',    subModule: 'profiles' },
            { icon: HardHat,    label: 'Funcionarios',     href: '/admin/employees',   subModule: 'employees' },
            { icon: Contact,    label: 'Consultores',      href: '/admin/consultants', subModule: 'consultants' },
            { icon: Store,      label: 'Lojas',            href: '/admin/stores',      subModule: 'stores' },
            { icon: Wrench,     label: 'Serviços',         href: '/servicos',          subModule: 'services' },
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
    const [isHovered, setIsHovered] = useState(false);
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

    // On desktop: expanded means hovered. On mobile: always "expanded" visually (slide-in).
    const expanded = isHovered;

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
                    'fixed inset-y-0 left-0 z-50 flex flex-col',
                    'border-r border-[#1E1E1E]',
                    'transition-all duration-200 ease-in-out',
                    // Mobile: always full width, slide-in controlled by transform
                    'w-[240px]',
                    // Desktop: collapsed by default, expand on hover
                    'md:w-[60px]',
                    expanded && 'md:w-[240px]',
                )}
                style={{ backgroundColor: '#111111' }}
                aria-label="Navegacao principal"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Logo */}
                <div
                    className="flex h-[60px] items-center justify-between px-4 flex-shrink-0 border-b border-[#1E1E1E] overflow-hidden"
                    style={{ backgroundColor: '#111111' }}
                >
                    {/* Desktop collapsed: icon only */}
                    <div className={cn(
                        'md:flex hidden items-center justify-center w-full transition-all duration-200',
                        expanded && 'md:hidden'
                    )}>
                        <WashCenterIcon size={28} color="#F5A800" />
                    </div>

                    {/* Desktop expanded + mobile: full logo */}
                    <div className={cn(
                        'hidden items-center transition-all duration-200',
                        'md:hidden',
                        expanded && 'md:flex',
                        // Mobile always shows full logo
                        'max-md:flex'
                    )}>
                        <WashCenterLogo size={28} />
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-[#555] hover:text-white hover:bg-[#1E1E1E] h-8 w-8 flex-shrink-0"
                        onClick={onClose}
                        aria-label="Fechar menu"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Nav */}
                <nav
                    className="flex-1 overflow-y-auto overflow-x-hidden py-2 aems-scroll"
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
                                {/* Group label — hidden when collapsed on desktop */}
                                <div className={cn(
                                    'transition-all duration-200 overflow-hidden',
                                    // Desktop collapsed: invisible but takes minimal space
                                    'md:h-0 md:opacity-0',
                                    expanded && 'md:h-auto md:opacity-100',
                                    // Mobile: always visible
                                    'max-md:h-auto max-md:opacity-100'
                                )}>
                                    <p
                                        className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] select-none whitespace-nowrap"
                                        style={{ color: '#3A3A3A' }}
                                    >
                                        {group.label}
                                    </p>
                                </div>

                                <div className="space-y-0.5 px-2">
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
                                                    // Desktop collapsed: center the icon
                                                    'md:justify-center',
                                                    expanded && 'md:justify-start',
                                                    // Active state
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
                                                {/* Label — hidden when collapsed on desktop */}
                                                <span className={cn(
                                                    'truncate leading-none transition-all duration-200 whitespace-nowrap',
                                                    // Desktop collapsed: hide
                                                    'md:opacity-0 md:w-0 md:overflow-hidden',
                                                    expanded && 'md:opacity-100 md:w-auto md:overflow-visible',
                                                    // Mobile: always visible
                                                    'max-md:opacity-100 max-md:w-auto'
                                                )}>
                                                    {item.label}
                                                </span>
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
                    className="flex-shrink-0 px-2 py-3 border-t border-[#1E1E1E] overflow-hidden"
                    style={{ backgroundColor: '#111111' }}
                >
                    <div className={cn(
                        'flex items-center py-2 rounded-lg transition-colors cursor-default hover:bg-[#1A1A1A]',
                        // Desktop collapsed: center avatar
                        'md:justify-center md:px-0',
                        expanded && 'md:justify-start md:px-2 md:gap-2.5',
                        // Mobile: always full
                        'max-md:gap-2.5 max-md:px-2'
                    )}>
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'rgba(245,168,0,0.20)' }}
                        >
                            <span className="text-[10px] font-bold" style={{ color: '#F5A800' }}>
                                {userInitials}
                            </span>
                        </div>
                        {/* User info — hidden when collapsed on desktop */}
                        <div className={cn(
                            'min-w-0 transition-all duration-200',
                            'md:opacity-0 md:w-0 md:overflow-hidden',
                            expanded && 'md:opacity-100 md:w-auto md:overflow-visible',
                            'max-md:opacity-100 max-md:w-auto'
                        )}>
                            <p className="text-xs font-medium text-white truncate leading-tight whitespace-nowrap">
                                {user?.full_name ?? 'Usuario'}
                            </p>
                            <p className="text-[10px] truncate leading-none whitespace-nowrap" style={{ color: '#555' }}>
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
