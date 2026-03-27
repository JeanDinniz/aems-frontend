import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UsersTable } from '@/components/features/users/UsersTable';
import { UserFilters } from '@/components/features/users/UserFilters';
import { CreateUserDialog } from '@/components/features/users/CreateUserDialog';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import type { UserFilters as Filters } from '@/types/user.types';
import { Navigate } from 'react-router-dom';

export function UserManagementPage() {
    const [filters, setFilters] = useState<Filters>({});
    const [page, setPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const { user } = useAuth();
    const isOwner = user?.role === 'owner';
    const { users, total, isLoading } = useUsers(filters, page);

    if (!isOwner) {
        // Optional: Redirect or Show access denied message
        return <Navigate to="/" replace />;
    }

    const handleExport = () => {
        // TODO: Exportar lista de usuários para Excel
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
                    <p className="text-muted-foreground">Gerenciar operadores, supervisores e owners</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <UserFilters filters={filters} onFiltersChange={setFilters} />

            {/* Tabela */}
            <UsersTable
                users={users}
                isLoading={isLoading}
                page={page}
                pageSize={20}
                total={total}
                onPageChange={setPage}
            />

            {/* Dialog Criar */}
            <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        </div>
    );
}
