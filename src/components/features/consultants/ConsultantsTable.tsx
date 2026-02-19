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
import { Skeleton } from '@/components/ui/skeleton';
import { ConsultantStatusBadge } from './ConsultantStatusBadge';
import { EditConsultantDialog } from './EditConsultantDialog';
import { useConsultants } from '@/hooks/useConsultants';
import type { Consultant } from '@/types/consultant.types';

interface ConsultantsTableProps {
    consultants: Consultant[];
    isLoading: boolean;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function ConsultantsTable({ consultants, isLoading, page, pageSize, total, onPageChange }: ConsultantsTableProps) {
    const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const { deactivateConsultant, activateConsultant } = useConsultants();

    const handleEdit = (consultant: Consultant) => {
        setSelectedConsultant(consultant);
        setEditDialogOpen(true);
    };

    const handleToggleStatus = (consultant: Consultant) => {
        if (consultant.is_active) {
            deactivateConsultant(consultant.id);
        } else {
            activateConsultant(consultant.id);
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
                            <TableHead>Nome</TableHead>
                            <TableHead>Loja</TableHead>
                            <TableHead>Concessionária</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {consultants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                    Nenhum consultor encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            consultants.map((consultant) => (
                                <TableRow key={consultant.id}>
                                    <TableCell>
                                        <div className="font-medium">{consultant.name}</div>
                                    </TableCell>

                                    <TableCell>
                                        <span className="text-sm text-gray-600">
                                            {consultant.store_name || 'N/A'}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        <span className="text-sm text-gray-600">
                                            {consultant.dealership_name || 'N/A'}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        {consultant.phone ? (
                                            <span className="text-sm text-gray-600">{consultant.phone}</span>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {consultant.email ? (
                                            <span className="text-sm text-gray-600">{consultant.email}</span>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <ConsultantStatusBadge isActive={consultant.is_active} />
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(consultant)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(consultant)}>
                                                    <span className={consultant.is_active ? 'text-red-600' : 'text-green-600'}>
                                                        {consultant.is_active ? 'Desativar' : 'Ativar'}
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
                        {Math.min(page * pageSize, total)} de {total} consultores
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
            {selectedConsultant && (
                <EditConsultantDialog
                    consultant={selectedConsultant}
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                />
            )}
        </div>
    );
}
