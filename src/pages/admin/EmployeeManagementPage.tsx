import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmployeesTable } from '@/components/features/employees/EmployeesTable';
import { EmployeeFilters } from '@/components/features/employees/EmployeeFilters';
import { CreateEmployeeDialog } from '@/components/features/employees/CreateEmployeeDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import type { EmployeeFilters as Filters } from '@/types/employee.types';
import { Navigate } from 'react-router-dom';

export function EmployeeManagementPage() {
    const [filters, setFilters] = useState<Filters>({});
    const [page, setPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const { user } = useAuth();
    const isOwner = user?.role === 'owner';
    const { employees, total, isLoading } = useEmployees(filters, page);

    if (!isOwner) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
                    <p className="text-muted-foreground">
                        Gerencie os funcionários das lojas. Apenas funcionários ativos aparecem nas ordens de serviço.
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Funcionário
                </Button>
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
