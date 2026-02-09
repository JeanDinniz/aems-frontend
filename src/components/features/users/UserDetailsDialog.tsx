import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RoleBadge } from './RoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import type { User } from '@/types/user.types';

interface UserDetailsDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Detalhes do Usuário</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b">
                        <div>
                            <h3 className="text-lg font-semibold">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <UserStatusBadge status={user.status} />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Cargo</span>
                            <div className="mt-1">
                                <RoleBadge role={user.role} />
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-500">Telefone</span>
                            <p>{user.phone || '-'}</p>
                        </div>

                        {user.role === 'operator' && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Loja Atribuída</span>
                                <p>{user.storeName || '-'}</p>
                            </div>
                        )}

                        {user.role === 'supervisor' && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Lojas Supervisionadas</span>
                                <p>{user.supervisedStoreNames?.join(', ') || '-'}</p>
                            </div>
                        )}

                        <div>
                            <span className="text-sm font-medium text-gray-500">Último Login</span>
                            <p>
                                {user.lastLoginAt
                                    ? new Date(user.lastLoginAt).toLocaleString('pt-BR')
                                    : 'Nunca'}
                            </p>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-500">Data de Criação</span>
                            <p>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
