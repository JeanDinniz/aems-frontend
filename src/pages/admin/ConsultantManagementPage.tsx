import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { ConsultantsTable } from '@/components/features/consultants/ConsultantsTable';
import { ConsultantFilters } from '@/components/features/consultants/ConsultantFilters';
import { CreateConsultantDialog } from '@/components/features/consultants/CreateConsultantDialog';
import { useConsultants } from '@/hooks/useConsultants';
import { useAuthStore } from '@/stores/auth.store';
import type { ConsultantFilters as Filters } from '@/types/consultant.types';

export function ConsultantManagementPage() {
    const [filters, setFilters] = useState<Filters>({});
    const [page, setPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const hasPermission = useAuthStore((s) => s.hasPermission);
    const canEdit = hasPermission('consultants', 'edit');
    const { consultants, total, isLoading } = useConsultants(filters, page);

    const handleExport = () => {
        // TODO: Exportar lista de consultores para Excel
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
                        Gestão de Consultores
                    </h1>
                    <p className="text-[#666666] dark:text-zinc-400 text-sm">Gerenciar consultores das concessionárias</p>
                </div>
                <div className="flex gap-2">
                    {canEdit && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 hover:border-[#F5A800] hover:text-[#F5A800] bg-transparent transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                    )}
                    {canEdit && (
                        <button
                            onClick={() => setCreateDialogOpen(true)}
                            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold disabled:opacity-60"
                            style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                        >
                            <Plus className="h-4 w-4" />
                            Novo Consultor
                        </button>
                    )}
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
