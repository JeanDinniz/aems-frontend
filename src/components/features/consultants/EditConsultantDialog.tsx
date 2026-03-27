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
import { useConsultants } from '@/hooks/useConsultants';
import { useStores } from '@/hooks/useStores';
import type { Consultant } from '@/types/consultant.types';

const editConsultantSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    store_id: z.number({ error: 'Loja é obrigatória' }),
    phone: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
});

type EditConsultantForm = z.infer<typeof editConsultantSchema>;

interface EditConsultantDialogProps {
    consultant: Consultant;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditConsultantDialog({ consultant, open, onOpenChange }: EditConsultantDialogProps) {
    const { updateConsultant, isUpdating } = useConsultants();
    const { stores } = useStores();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditConsultantForm>({
        resolver: zodResolver(editConsultantSchema),
    });

    const selectedStoreId = watch('store_id');

    useEffect(() => {
        if (open && consultant) {
            reset({
                name: consultant.name,
                store_id: consultant.store_id,
                phone: consultant.phone || '',
                email: consultant.email || '',
            });
        }
    }, [open, consultant, reset]);

    const onSubmit = (data: EditConsultantForm) => {
        updateConsultant({
            id: consultant.id,
            payload: {
                name: data.name,
                store_id: data.store_id,
                phone: data.phone || undefined,
                email: data.email || undefined,
            },
        }, {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Editar Consultor</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="ec-name" className="text-sm font-medium">Nome</label>
                        <Input id="ec-name" {...register('name')} />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="ec-store" className="text-sm font-medium">
                            Loja <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={selectedStoreId?.toString()}
                            onValueChange={(val) => setValue('store_id', parseInt(val))}
                        >
                            <SelectTrigger id="ec-store">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="ec-phone" className="text-sm font-medium">Telefone</label>
                            <Input
                                id="ec-phone"
                                {...register('phone')}
                                placeholder="(00) 00000-0000"
                                type="tel"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="ec-email" className="text-sm font-medium">E-mail</label>
                            <Input
                                id="ec-email"
                                type="email"
                                {...register('email')}
                                placeholder="email@exemplo.com"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
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
