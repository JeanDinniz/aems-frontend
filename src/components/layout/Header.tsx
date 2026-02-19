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
import {
    Menu,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';
import { StoreSelector } from '@/components/common/StoreSelector';
import { useNavigate } from "react-router-dom";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
