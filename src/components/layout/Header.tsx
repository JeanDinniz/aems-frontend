import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Menu,
    Bell,
    CheckCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';
import { StoreSelector } from '@/components/common/StoreSelector';
import { useNavigate } from "react-router-dom";
import { useNotifications, useUnreadNotificationCount, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const { data: unreadCount = 0 } = useUnreadNotificationCount();
    const { data: notifications = [] } = useNotifications(5);
    const markAllRead = useMarkAllNotificationsRead();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const formatRelativeTime = (dateStr: string): string => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60_000);
        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}min atrás`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)}d atrás`;
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-aems-neutral-100 bg-aems-white px-4 shadow-sm md:px-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight">AEMS</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">Auto Estética Management System</span>
                </div>
            </div>

            {/* Breadcrumbs placeholder / Store Selector */}
            <div className="hidden md:flex flex-1 mx-4">
                <StoreSelector />
            </div>

            <div className="flex items-center gap-4">
                <ConnectionIndicator />

                {/* Notifications Bell */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end">
                        <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Notificações</span>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs gap-1 px-2"
                                    onClick={() => markAllRead.mutate()}
                                    disabled={markAllRead.isPending}
                                >
                                    <CheckCheck className="h-3 w-3" />
                                    Marcar todas como lidas
                                </Button>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Nenhuma notificação
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={cn(
                                        'flex flex-col items-start gap-1 p-3 cursor-pointer',
                                        !notification.read && 'bg-muted/50'
                                    )}
                                    onClick={() => {
                                        if (notification.related_url) {
                                            navigate(notification.related_url);
                                        }
                                    }}
                                >
                                    <div className="flex w-full items-start justify-between gap-2">
                                        <span className={cn(
                                            'text-sm leading-tight',
                                            !notification.read && 'font-semibold'
                                        )}>
                                            {notification.title}
                                        </span>
                                        {!notification.read && (
                                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" aria-hidden="true" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {formatRelativeTime(notification.created_at)}
                                    </span>
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={undefined} alt={user?.full_name} />
                                <AvatarFallback>{user?.full_name ? getInitials(user.full_name) : 'U'}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">
                                    {user?.role}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                            Meu Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/settings')}>
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
