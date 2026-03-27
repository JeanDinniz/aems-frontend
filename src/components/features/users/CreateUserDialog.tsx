import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/useUsers';
import { storesService } from '@/services/api/stores.service';
import type { UserRole } from '@/types/user.types';

const createUserSchema = z.object({
    full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    role: z.enum(['owner', 'supervisor', 'operator']),
    store_id: z.number().optional(),
    supervised_store_ids: z.array(z.number()).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
    const { createUser, isCreating } = useUsers();
    const { data: stores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            supervised_store_ids: [],
        }
    });

    const selectedRole = watch('role');

    const onSubmit = (data: CreateUserForm) => {
        createUser(data, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Novo Usuário</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="cu-fullname" className="text-sm font-medium">Nome Completo</label>
                            <Input
                                id="cu-fullname"
                                {...register('full_name')}
                                placeholder="Ex: João da Silva"
                            />
                            {errors.full_name && (
                                <p className="text-sm text-red-500">{errors.full_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="cu-email" className="text-sm font-medium">E-mail</label>
                            <Input
                                id="cu-email"
                                type="email"
                                {...register('email')}
                                placeholder="email@exemplo.com"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cu-role" className="text-sm font-medium">Cargo</label>
                        <Select onValueChange={(value) => setValue('role', value as UserRole)}>
                            <SelectTrigger id="cu-role">
                                <SelectValue placeholder="Selecione o cargo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operator">Operador</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="owner">Proprietário</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role.message}</p>
                        )}
                    </div>

                    {selectedRole === 'operator' && (
                        <div className="space-y-2">
                            <label htmlFor="cu-store" className="text-sm font-medium">
                                Loja <span className="text-red-500">*</span>
                            </label>
                            <Select
                                onValueChange={(value) => setValue('store_id', parseInt(value))}
                            >
                                <SelectTrigger id="cu-store">
                                    <SelectValue placeholder="Selecione a loja" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stores?.map((store) => (
                                        <SelectItem key={store.id} value={store.id.toString()}>
                                            {store.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.store_id && (
                                <p className="text-sm text-red-500">Loja obrigatória para operadores</p>
                            )}
                        </div>
                    )}

                    {selectedRole === 'supervisor' && (
                        <div className="space-y-2">
                            <span className="text-sm font-medium">
                                Lojas Supervisionadas <span className="text-red-500">*</span>
                            </span>
                            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                                {stores?.map((store) => (
                                    <label key={store.id} htmlFor={`cu-store-${store.id}`} className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            id={`cu-store-${store.id}`}
                                            onCheckedChange={(checked) => {
                                                const current = watch('supervised_store_ids') || [];
                                                if (checked) {
                                                    setValue('supervised_store_ids', [...current, store.id]);
                                                } else {
                                                    setValue(
                                                        'supervised_store_ids',
                                                        current.filter((id) => id !== store.id)
                                                    );
                                                }
                                            }}
                                        />
                                        <span className="text-sm">{store.name}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.supervised_store_ids && (
                                <p className="text-sm text-red-500">
                                    Selecione pelo menos uma loja
                                </p>
                            )}
                        </div>
                    )}

                    {selectedRole === 'owner' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                Proprietários têm acesso a todas as lojas do sistema.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? 'Criando...' : 'Criar Usuário'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
