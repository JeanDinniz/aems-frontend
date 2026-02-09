import { useEffect } from 'react';
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
import type { User, UserRole } from '@/types/user.types';

const editUserSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    phone: z.string().optional(),
    role: z.enum(['owner', 'supervisor', 'operator']),
    storeId: z.number().optional(),
    supervisedStoreIds: z.array(z.number()).optional(),
    active: z.boolean(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
    const { updateUser, isUpdating } = useUsers();
    const { data: stores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<EditUserForm>({
        resolver: zodResolver(editUserSchema),
    });

    useEffect(() => {
        if (open && user) {
            reset({
                name: user.name,
                phone: user.phone || '',
                role: user.role,
                storeId: user.storeId,
                supervisedStoreIds: user.supervisedStoreIds || [],
                active: user.active,
            });
        }
    }, [open, user, reset]);

    const selectedRole = watch('role');

    const onSubmit = (data: EditUserForm) => {
        updateUser({
            id: user.id,
            payload: data,
        }, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Editar Usuário</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome Completo</label>
                            <Input {...register('name')} />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">E-mail</label>
                            <Input value={user.email} disabled className="bg-gray-100" />
                            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Telefone</label>
                            <Input {...register('phone')} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cargo</label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value) => setValue('role', value as UserRole)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="operator">Operador</SelectItem>
                                    <SelectItem value="supervisor">Supervisor</SelectItem>
                                    <SelectItem value="owner">Proprietário</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedRole === 'operator' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Loja <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={watch('storeId')?.toString()}
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
                                            checked={watch('supervisedStoreIds')?.includes(store.id)}
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
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <Checkbox
                            id="active"
                            checked={watch('active')}
                            onCheckedChange={(checked) => setValue('active', checked as boolean)}
                        />
                        <label htmlFor="active" className="text-sm cursor-pointer font-medium">
                            Usuário Ativo
                        </label>
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
