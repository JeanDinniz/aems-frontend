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
import { useConsultants } from '@/hooks/useConsultants';
import type { Consultant } from '@/types/consultant.types';

const editConsultantSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
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

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EditConsultantForm>({
        resolver: zodResolver(editConsultantSchema),
    });

    useEffect(() => {
        if (open && consultant) {
            reset({
                name: consultant.name,
                phone: consultant.phone || '',
                email: consultant.email || '',
            });
        }
    }, [open, consultant, reset]);

    const onSubmit = (data: EditConsultantForm) => {
        const payload = {
            name: data.name,
            phone: data.phone || undefined,
            email: data.email || undefined,
        };

        updateConsultant({
            id: consultant.id,
            payload,
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
                    <DialogTitle>Editar Consultor</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nome</label>
                        <Input {...register('name')} />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Loja</label>
                        <Input
                            value={consultant.store_name || 'N/A'}
                            disabled
                            className="bg-gray-50"
                        />
                        <p className="text-sm text-gray-500">
                            A loja não pode ser alterada após a criação
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Telefone</label>
                            <Input
                                {...register('phone')}
                                placeholder="(00) 00000-0000"
                                type="tel"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone.message}</p>
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
