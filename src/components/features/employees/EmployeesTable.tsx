import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

    const { deleteEmployee, isDeletingEmployee } = useEmployees();

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
                                                <DropdownMenuItem
                                                    onClick={() => setEmployeeToDelete(emp)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!employeeToDelete}
                onOpenChange={(open) => { if (!open) setEmployeeToDelete(null); }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O funcionário{' '}
                            <span className="font-semibold">{employeeToDelete?.name}</span>{' '}
                            será excluído permanentemente. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingEmployee}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => employeeToDelete && deleteEmployee(employeeToDelete.id, {
                                onSuccess: () => setEmployeeToDelete(null),
                            })}
                            disabled={isDeletingEmployee}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeletingEmployee ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
