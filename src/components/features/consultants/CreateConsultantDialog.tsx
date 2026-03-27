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

const createConsultantSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    store_id: z.number({ error: 'Loja é obrigatória' }),
    phone: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
});

type CreateConsultantForm = z.infer<typeof createConsultantSchema>;

interface CreateConsultantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateConsultantDialog({ open, onOpenChange }: CreateConsultantDialogProps) {
    const { createConsultant, isCreating } = useConsultants();
    const { stores } = useStores();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm<CreateConsultantForm>({
        resolver: zodResolver(createConsultantSchema),
    });

    const onSubmit = (data: CreateConsultantForm) => {
        const payload = {
            name: data.name,
            store_id: data.store_id,
            phone: data.phone || undefined,
            email: data.email || undefined,
        };

        createConsultant(payload, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    const handleStoreChange = (value: string) => {
        const storeId = parseInt(value);
        setValue('store_id', storeId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Novo Consultor</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="cc-name" className="text-sm font-medium">
                            Nome <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="cc-name"
                            {...register('name')}
                            placeholder="Ex: João da Silva"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cc-store" className="text-sm font-medium">
                            Loja <span className="text-red-500">*</span>
                        </label>
                        <Select onValueChange={handleStoreChange}>
                            <SelectTrigger id="cc-store">
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
                            <label htmlFor="cc-phone" className="text-sm font-medium">Telefone</label>
                            <Input
                                id="cc-phone"
                                {...register('phone')}
                                placeholder="(00) 00000-0000"
                                type="tel"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="cc-email" className="text-sm font-medium">E-mail</label>
                            <Input
                                id="cc-email"
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
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? 'Criando...' : 'Criar Consultor'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
