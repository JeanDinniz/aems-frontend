import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-2xl font-bold text-[#111111] dark:text-white"
                        style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                    >
                        Gestão de Usuários
                    </h1>
                    <p className="text-[#666666] dark:text-zinc-400 text-sm">Gerenciar operadores, supervisores e owners</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Exportar
                    </button>
                    <button
                        onClick={() => setCreateDialogOpen(true)}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold disabled:opacity-60"
                        style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                    >
                        <Plus className="h-4 w-4" />
                        Novo Usuário
                    </button>
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
