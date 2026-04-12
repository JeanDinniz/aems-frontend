import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EmployeesTable } from '@/components/features/employees/EmployeesTable';
import { EmployeeFilters } from '@/components/features/employees/EmployeeFilters';
import { CreateEmployeeDialog } from '@/components/features/employees/CreateEmployeeDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthStore } from '@/stores/auth.store';
import type { EmployeeFilters as Filters } from '@/types/employee.types';

export function EmployeeManagementPage() {
    const [filters, setFilters] = useState<Filters>({});
    const [page, setPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const hasPermission = useAuthStore((s) => s.hasPermission);
    const canEdit = hasPermission('employees', 'edit');
    const { employees, total, isLoading } = useEmployees(filters, page);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-2xl font-bold text-[#111111] dark:text-white"
                        style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                    >
                        Funcionários
                    </h1>
                    <p className="text-[#666666] dark:text-zinc-400 text-sm">
                        Gerencie os funcionários das lojas. Apenas funcionários ativos aparecem nas ordens de serviço.
                    </p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setCreateDialogOpen(true)}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold disabled:opacity-60"
                        style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                    >
                        <Plus className="h-4 w-4" />
                        Novo Funcionário
                    </button>
                )}
            </div>

            <EmployeeFilters filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} />

            <EmployeesTable
                employees={employees}
                isLoading={isLoading}
                page={page}
                pageSize={20}
                total={total}
                onPageChange={setPage}
            />

            <CreateEmployeeDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        </div>
    );
}
