import { useState } from 'react';
import { MoreHorizontal, Edit, Key, Eye } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserStatusBadge } from './UserStatusBadge';
import { RoleBadge } from './RoleBadge';
import { EditUserDialog } from './EditUserDialog';
import { UserDetailsDialog } from './UserDetailsDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { useUsers } from '@/hooks/useUsers';
import type { User } from '@/types/user.types';

interface UsersTableProps {
    users: User[];
    isLoading: boolean;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function UsersTable({ users, isLoading, page, pageSize, total, onPageChange }: UsersTableProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);

    const { deactivateUser, activateUser } = useUsers();

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    const handleDetails = (user: User) => {
        setSelectedUser(user);
        setDetailsDialogOpen(true);
    };

    const handleResetPassword = (user: User) => {
        setSelectedUser(user);
        setResetPasswordDialogOpen(true);
    };

    const handleToggleStatus = (user: User) => {
        if (user.is_active) {
            deactivateUser(user.id);
        } else {
            activateUser(user.id);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Loja(s)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Último Login</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                    Nenhum usuário encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {user.full_name
                                                        .split(' ')
                                                        .slice(0, 2)
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.full_name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <RoleBadge role={user.role} />
                                    </TableCell>

                                    <TableCell>
                                        {user.role === 'owner' && (
                                            <span className="text-sm text-gray-600">Todas</span>
                                        )}
                                        {user.role === 'supervisor' && user.supervised_store_ids && (
                                            <span className="text-sm text-gray-600">
                                                {user.supervised_store_ids.length > 0
                                                    ? `${user.supervised_store_ids.length} loja(s)`
                                                    : 'Nenhuma'}
                                            </span>
                                        )}
                                        {user.role === 'operator' && (
                                            <span className="text-sm text-gray-600">{user.store_name || '-'}</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <UserStatusBadge isActive={user.is_active} />
                                    </TableCell>

                                    <TableCell>
                                        {user.last_login ? (
                                            <span className="text-sm text-gray-600">
                                                {new Date(user.last_login).toLocaleDateString('pt-BR')}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">Nunca</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDetails(user)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver Detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                                    <Key className="h-4 w-4 mr-2" />
                                                    Resetar Senha
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                                    <span className={user.is_active ? 'text-red-600' : 'text-green-600'}>
                                                        {user.is_active ? 'Desativar' : 'Ativar'}
                                                    </span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Mostrando {(page - 1) * pageSize + 1} a{' '}
                        {Math.min(page * pageSize, total)} de {total} usuários
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => onPageChange(page - 1)}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => onPageChange(page + 1)}
                        >
                            Próximo
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            {selectedUser && (
                <>
                    <EditUserDialog
                        user={selectedUser}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                    />
                    <UserDetailsDialog
                        user={selectedUser}
                        open={detailsDialogOpen}
                        onOpenChange={setDetailsDialogOpen}
                    />
                    <ResetPasswordDialog
                        user={selectedUser}
                        open={resetPasswordDialogOpen}
                        onOpenChange={setResetPasswordDialogOpen}
                    />
                </>
            )}
        </div>
    );
}
