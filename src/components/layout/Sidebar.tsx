import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Package, Users, Settings, X, ShoppingCart, AlertTriangle, UserX, PieChart, UserCog, Contact } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'owner' | 'supervisor' | 'operator';

interface SidebarItem {
    icon: typeof LayoutDashboard;
    label: string;
    href: string;
    roles?: UserRole[];
}

const sidebarItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: ClipboardList, label: 'Ordens de Serviço', href: '/service-orders' },
    { icon: Package, label: 'Inventário', href: '/inventory' },
    { icon: ShoppingCart, label: 'Solicitações de Compra', href: '/purchase-requests' },
    { icon: AlertTriangle, label: 'Incidentes', href: '/incidents' },
    { icon: UserX, label: 'RH / Ocorrências', href: '/hr/occurrences' },
    { icon: Users, label: 'Clientes', href: '/clients' },
    { icon: PieChart, label: 'Reports', href: '/reports/dashboard' },
    { icon: UserCog, label: 'Gestão de Usuários', href: '/admin/users', roles: ['owner'] },
    { icon: Contact, label: 'Consultores', href: '/admin/consultants', roles: ['owner'] },
    { icon: Settings, label: 'Configurações', href: '/settings' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const { user } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-[240px] bg-gradient-to-b from-aems-neutral-900 to-aems-neutral-800 border-r border-white/5 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen shadow-2xl",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        {/* Logo Icon with Gradient and Shadow */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aems-primary-400 to-aems-primary-600 shadow-[0_0_16px_rgba(252,175,22,0.3)] flex items-center justify-center">
                            <span className="font-bold text-white text-xs">AE</span>
                        </div>
                        <span className="font-bold text-lg text-white truncate">
                            {user?.role === 'owner' ? 'AEMS' : (user?.store_id ? `Unidade ${user.store_id}` : 'AEMS')}
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-aems-neutral-400 hover:text-white hover:bg-white/5"
                        onClick={onClose}
                        aria-label="Fechar menu de navegação"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="p-4 space-y-1">
                    {sidebarItems
                    .filter((item) => !item.roles || (user?.role && item.roles.includes(user.role as UserRole)))
                    .map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.href) && (item.href !== '/dashboard' || location.pathname === '/dashboard');

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => onClose()} // Auto-close on mobile nav
                                className={cn(
                                    "group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                                    isActive
                                        ? "text-aems-primary-400 bg-[rgba(252,175,22,0.1)]"
                                        : "text-aems-neutral-300 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-aems-primary-400 shadow-[0_0_8px_rgba(252,175,22,0.5)] -ml-4" />
                                )}
                                <Icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-aems-primary-400" : "text-aems-neutral-400 group-hover:text-white")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
