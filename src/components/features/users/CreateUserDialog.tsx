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
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().optional(),
    role: z.enum(['owner', 'supervisor', 'operator']),
    storeId: z.number().optional(),
    supervisedStoreIds: z.array(z.number()).optional(),
    sendWelcomeEmail: z.boolean().default(true),
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
            sendWelcomeEmail: true,
            supervisedStoreIds: [],
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
                            <label className="text-sm font-medium">Nome Completo</label>
                            <Input
                                {...register('name')}
                                placeholder="Ex: João da Silva"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">E-mail</label>
                            <Input
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
                            <label className="text-sm font-medium">Telefone (opcional)</label>
                            <Input
                                {...register('phone')}
                                placeholder="(00) 00000-0000"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cargo</label>
                            <Select onValueChange={(value) => setValue('role', value as UserRole)}>
                                <SelectTrigger>
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
                    </div>

                    {selectedRole === 'operator' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Loja <span className="text-red-500">*</span>
                            </label>
                            <Select
                                onValueChange={(value) => setValue('storeId', parseInt(value))}
                            >
                                <SelectTrigger>
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
                            {errors.storeId && (
                                <p className="text-sm text-red-500">Loja obrigatória para operadores</p>
                            )}
                        </div>
                    )}

                    {selectedRole === 'supervisor' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Lojas Supervisionadas <span className="text-red-500">*</span>
                            </label>
                            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                                {stores?.map((store) => (
                                    <label key={store.id} className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            onCheckedChange={(checked) => {
                                                const current = watch('supervisedStoreIds') || [];
                                                if (checked) {
                                                    setValue('supervisedStoreIds', [...current, store.id]);
                                                } else {
                                                    setValue(
                                                        'supervisedStoreIds',
                                                        current.filter((id) => id !== store.id)
                                                    );
                                                }
                                            }}
                                        />
                                        <span className="text-sm">{store.name}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.supervisedStoreIds && (
                                <p className="text-sm text-red-500">
                                    Selecione pelo menos uma loja
                                </p>
                            )}
                        </div>
                    )}

                    {selectedRole === 'owner' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                ℹ️ Proprietários têm acesso a todas as lojas do sistema.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="welcome-email"
                            checked={watch('sendWelcomeEmail')}
                            onCheckedChange={(checked) =>
                                setValue('sendWelcomeEmail', checked as boolean)
                            }
                        />
                        <label htmlFor="welcome-email" className="text-sm cursor-pointer">
                            Enviar e-mail de boas-vindas com senha temporária
                        </label>
                    </div>

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
