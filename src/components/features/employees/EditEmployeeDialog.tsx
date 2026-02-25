import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/hooks/useEmployees';
import type { Employee } from '@/types/employee.types';
import { EMPLOYEE_POSITIONS, positionToDepartment } from '@/constants/employees';

const schema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    position: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    employee: Employee;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange }: Props) {
    const { updateEmployee, isUpdating } = useEmployees();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (open) reset({ name: employee.name, position: employee.position ?? undefined });
    }, [open, employee, reset]);

    const currentPosition = watch('position');

    const onSubmit = (data: FormData) => {
        updateEmployee(
            {
                id: employee.id,
                payload: {
                    name: data.name,
                    position: data.position || null,
                    department: positionToDepartment(data.position) ?? null,
                },
            },
            { onSuccess: () => onOpenChange(false) },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Funcionário</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nome Completo</label>
                        <Input {...register('name')} />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Loja</label>
                        <Input value={employee.store_name || 'N/A'} disabled className="bg-gray-50" />
                        <p className="text-sm text-gray-500">A loja não pode ser alterada após o cadastro</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cargo</label>
                        <Select
                            value={currentPosition || 'none'}
                            onValueChange={(v) => setValue('position', v === 'none' ? undefined : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o cargo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sem cargo definido</SelectItem>
                                {EMPLOYEE_POSITIONS.map((pos) => (
                                    <SelectItem key={pos.value} value={pos.value}>
                                        {pos.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Instaladores de Película aparecem somente em OS de Película. Os demais aparecem em todos os tipos de OS.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
