import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsultantsTable } from '@/components/features/consultants/ConsultantsTable';
import { ConsultantFilters } from '@/components/features/consultants/ConsultantFilters';
import { CreateConsultantDialog } from '@/components/features/consultants/CreateConsultantDialog';
import { useConsultants } from '@/hooks/useConsultants';
import { useAuth } from '@/hooks/useAuth';
import type { ConsultantFilters as Filters } from '@/types/consultant.types';
import { Navigate } from 'react-router-dom';

export function ConsultantManagementPage() {
    const [filters, setFilters] = useState<Filters>({});
    const [page, setPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const { user } = useAuth();
    const isOwner = user?.role === 'owner';
    const { consultants, total, isLoading } = useConsultants(filters, page);

    if (!isOwner) {
        // Optional: Redirect or Show access denied message
        return <Navigate to="/" replace />;
    }

    const handleExport = async () => {
        // TODO: Implement export
        console.log('Exporting...', filters);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestão de Consultores</h1>
                    <p className="text-muted-foreground">Gerenciar consultores das concessionárias</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Consultor
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <ConsultantFilters filters={filters} onFiltersChange={setFilters} />

            {/* Tabela */}
            <ConsultantsTable
                consultants={consultants}
                isLoading={isLoading}
                page={page}
                pageSize={20}
                total={total}
                onPageChange={setPage}
            />

            {/* Dialog Criar */}
            <CreateConsultantDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        </div>
    );
}
