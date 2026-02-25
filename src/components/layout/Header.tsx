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
import { Menu, Bell, CheckCheck, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';
import { StoreSelector } from '@/components/common/StoreSelector';
import { useNavigate } from "react-router-dom";
import { useNotifications, useUnreadNotificationCount, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick: () => void;
}

const roleLabels: Record<string, string> = {
    owner: 'Proprietário',
    supervisor: 'Supervisor',
    operator: 'Operador',
};

const roleColors: Record<string, string> = {
    owner:      'bg-aems-primary-400/15 text-aems-primary-600 border-aems-primary-400/30',
    supervisor: 'bg-blue-50 text-blue-700 border-blue-200',
    operator:   'bg-aems-neutral-100 text-aems-neutral-600 border-aems-neutral-200',
};

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

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

    const formatRelativeTime = (dateStr: string): string => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60_000);
        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}min atrás`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)}d atrás`;
    };

    const userInitials = user?.full_name ? getInitials(user.full_name) : 'U';
    const roleColor = user?.role ? roleColors[user.role] ?? roleColors.operator : roleColors.operator;
    const roleLabel = user?.role ? roleLabels[user.role] ?? user.role : '';

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background px-4 shadow-sm md:px-6">
            {/* Left: menu + brand */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-aems-neutral-500 hover:text-aems-neutral-700"
                    onClick={onMenuClick}
                    aria-label="Abrir menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="hidden md:flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aems-primary-400 to-aems-primary-600 flex items-center justify-center shadow-[0_0_10px_rgba(252,175,22,0.25)]">
                        <span className="font-black text-white text-[10px]">AE</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground leading-tight">AEMS</span>
                        <span className="text-[10px] text-muted-foreground leading-none hidden sm:block">
                            Auto Estética Management
                        </span>
                    </div>
                </div>
            </div>

            {/* Center: store selector */}
            <div className="hidden md:flex flex-1 mx-6 max-w-xs">
                <StoreSelector />
            </div>

            {/* Right: indicators + notifications + avatar */}
            <div className="flex items-center gap-2">
                {/* Role badge */}
                {user?.role && (
                    <span className={cn(
                        'hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                        roleColor
                    )}>
                        {roleLabel}
                    </span>
                )}

                <ConnectionIndicator />

                {/* Notifications Bell */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative text-aems-neutral-500 hover:text-aems-neutral-700 hover:bg-aems-neutral-100"
                            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-aems-error text-white text-[10px] font-bold px-1 leading-none animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 shadow-lg border-aems-neutral-150" align="end">
                        <DropdownMenuLabel className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-aems-neutral-500" />
                                <span className="font-semibold text-sm">Notificações</span>
                                {unreadCount > 0 && (
                                    <Badge className="h-5 text-[10px] bg-aems-error text-white border-0 px-1.5">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1 px-2 text-aems-primary-600 hover:text-aems-primary-700 hover:bg-aems-primary-400/10"
                                    onClick={() => markAllRead.mutate()}
                                    disabled={markAllRead.isPending}
                                >
                                    <CheckCheck className="h-3 w-3" />
                                    Marcar todas
                                </Button>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <Bell className="h-8 w-8 text-aems-neutral-200 mx-auto mb-2" />
                                <p className="text-sm text-aems-neutral-400">Sem notificações</p>
                            </div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto aems-scroll">
                                {notifications.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        className={cn(
                                            'flex flex-col items-start gap-1 p-3 cursor-pointer rounded-none border-b border-aems-neutral-100 last:border-0',
                                            !notification.read && 'bg-aems-primary-400/5'
                                        )}
                                        onClick={() => {
                                            if (notification.related_url) navigate(notification.related_url);
                                        }}
                                    >
                                        <div className="flex w-full items-start justify-between gap-2">
                                            <span className={cn(
                                                'text-sm leading-tight',
                                                !notification.read && 'font-semibold text-aems-neutral-700'
                                            )}>
                                                {notification.title}
                                            </span>
                                            {!notification.read && (
                                                <span className="w-2 h-2 rounded-full bg-aems-primary-400 shrink-0 mt-1 aems-dot-pulse" aria-hidden="true" />
                                            )}
                                        </div>
                                        <p className="text-xs text-aems-neutral-400 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <span className="text-[10px] text-aems-neutral-300">
                                            {formatRelativeTime(notification.created_at)}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Avatar + user menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-aems-primary-400/30 transition-all"
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={undefined} alt={user?.full_name} />
                                <AvatarFallback className="bg-gradient-to-br from-aems-primary-400 to-aems-primary-600 text-white text-xs font-bold">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-60 shadow-lg border-aems-neutral-150" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal p-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-aems-primary-400 to-aems-primary-600 text-white text-sm font-bold">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-semibold text-aems-neutral-700 truncate">{user?.full_name}</p>
                                    <p className="text-xs text-aems-neutral-400 truncate">{user?.email}</p>
                                    <span className={cn(
                                        'inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-1',
                                        roleColor
                                    )}>
                                        {roleLabel}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2 cursor-pointer text-aems-neutral-600 hover:text-aems-neutral-800"
                            onClick={() => navigate('/profile')}
                        >
                            <User className="h-4 w-4" />
                            Meu Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="gap-2 cursor-pointer text-aems-neutral-600 hover:text-aems-neutral-800"
                            onClick={() => navigate('/settings')}
                        >
                            <Settings className="h-4 w-4" />
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2 cursor-pointer text-aems-error focus:text-aems-error focus:bg-aems-error/5"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
