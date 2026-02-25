import { useState } from 'react';
import { MoreHorizontal, Edit } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EditEmployeeDialog } from './EditEmployeeDialog';
import { useEmployees } from '@/hooks/useEmployees';
import type { Employee } from '@/types/employee.types';

interface Props {
    employees: Employee[];
    isLoading: boolean;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function EmployeesTable({ employees, isLoading, page, pageSize, total, onPageChange }: Props) {
    const [selected, setSelected] = useState<Employee | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const { deactivateEmployee, activateEmployee } = useEmployees();

    const handleToggle = (emp: Employee) => {
        if (emp.is_active) {
            deactivateEmployee(emp.id);
        } else {
            activateEmployee(emp.id);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
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
                            <TableHead>Nome</TableHead>
                            <TableHead>Loja</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                    Nenhum funcionário encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {emp.store_name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {emp.position || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={emp.is_active ? 'default' : 'secondary'}>
                                            {emp.is_active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { setSelected(emp); setEditOpen(true); }}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggle(emp)}>
                                                    <span className={emp.is_active ? 'text-red-600' : 'text-green-600'}>
                                                        {emp.is_active ? 'Desativar (Demitido)' : 'Reativar'}
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

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total)} de {total} funcionários
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                            Anterior
                        </Button>
                        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
                            Próximo
                        </Button>
                    </div>
                </div>
            )}

            {selected && (
                <EditEmployeeDialog employee={selected} open={editOpen} onOpenChange={setEditOpen} />
            )}
        </div>
    );
}
