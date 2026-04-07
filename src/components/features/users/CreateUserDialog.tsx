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
import { useUsers } from '@/hooks/useUsers';
import type { UserRole } from '@/types/user.types';

const createUserSchema = z.object({
    full_name: z.string().min(3, 'Nome deve ter no minimo 3 caracteres'),
    email: z.string().email('E-mail invalido'),
    role: z.enum(['owner', 'user']),
    password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
    const { createUser, isCreating } = useUsers();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
    });

    const selectedRole = watch('role');

    const onSubmit = (data: CreateUserForm) => {
        createUser({
            full_name: data.full_name,
            email: data.email,
            role: data.role as UserRole,
            password: data.password,
        }, {
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
                    <DialogTitle>Novo Usuario</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="cu-fullname" className="text-sm font-medium">Nome Completo</label>
                            <Input
                                id="cu-fullname"
                                {...register('full_name')}
                                placeholder="Ex: Joao da Silva"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="cu-role" className="text-sm font-medium">Cargo</label>
                            <Select onValueChange={(value) => setValue('role', value as CreateUserForm['role'])}>
                                <SelectTrigger id="cu-role">
                                    <SelectValue placeholder="Selecione o cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">Usuario</SelectItem>
                                    <SelectItem value="owner">Proprietario</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-sm text-red-500">{errors.role.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="cu-password" className="text-sm font-medium">Senha Temporaria</label>
                            <Input
                                id="cu-password"
                                type="password"
                                {...register('password')}
                                placeholder="Minimo 8 caracteres"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    {selectedRole === 'user' && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                Este usuario tera acesso baseado em perfis. Vincule os perfis apos criar o usuario via "Editar".
                            </p>
                        </div>
                    )}

                    {selectedRole === 'owner' && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Proprietarios tem acesso total a todas as lojas do sistema.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? 'Criando...' : 'Criar Usuario'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
