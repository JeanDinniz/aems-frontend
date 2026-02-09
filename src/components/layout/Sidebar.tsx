import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Package, Users, Settings, X, ShoppingCart, AlertTriangle, UserX, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: ClipboardList, label: 'Ordens de Serviço', href: '/service-orders' },
    { icon: Package, label: 'Inventário', href: '/inventory' },
    { icon: ShoppingCart, label: 'Solicitações de Compra', href: '/purchase-requests' },
    { icon: AlertTriangle, label: 'Incidentes', href: '/incidents' },
    { icon: UserX, label: 'RH / Ocorrências', href: '/hr/occurrences' },
    { icon: Users, label: 'Clientes', href: '/clients' },
    { icon: PieChart, label: 'Reports', href: '/reports/dashboard' },
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
                    "fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between px-4 border-b">
                    <span className="font-semibold text-lg truncate">
                        {user?.role === 'owner' ? 'Todas as Localizações' : (user?.store_id ? `Unidade ${user.store_id}` : 'AEMS')}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={onClose}
                        aria-label="Fechar menu de navegação"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="p-4 space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => onClose()} // Auto-close on mobile nav
                                className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-gray-700 hover:bg-gray-200"
                                )}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
