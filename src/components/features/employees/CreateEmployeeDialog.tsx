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
import { useStores } from '@/hooks/useStores';
import { EMPLOYEE_POSITIONS, positionToDepartment } from '@/constants/employees';

const schema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    store_id: z.number({ error: 'Loja é obrigatória' }),
    position: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateEmployeeDialog({ open, onOpenChange }: Props) {
    const { createEmployee, isCreating } = useEmployees();
    const { stores } = useStores();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = (data: FormData) => {
        const payload = {
            name: data.name,
            store_id: data.store_id,
            position: data.position || undefined,
            department: positionToDepartment(data.position),
        };
        createEmployee(payload, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Novo Funcionário</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="cre-name" className="text-sm font-medium">
                            Nome Completo <span className="text-red-500">*</span>
                        </label>
                        <Input id="cre-name" {...register('name')} placeholder="Ex: Jean Silva" />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cre-store" className="text-sm font-medium">
                            Loja <span className="text-red-500">*</span>
                        </label>
                        <Select onValueChange={(v) => setValue('store_id', parseInt(v))}>
                            <SelectTrigger id="cre-store">
                                <SelectValue placeholder="Selecione a loja" />
                            </SelectTrigger>
                            <SelectContent>
                                {stores?.map((store) => (
                                    <SelectItem key={store.id} value={store.id.toString()}>
                                        {store.code} - {store.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.store_id && (
                            <p className="text-sm text-red-500">{errors.store_id.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cre-position" className="text-sm font-medium">Cargo</label>
                        <Select onValueChange={(v) => setValue('position', v === 'none' ? undefined : v)}>
                            <SelectTrigger id="cre-position">
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
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? 'Cadastrando...' : 'Cadastrar Funcionário'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
