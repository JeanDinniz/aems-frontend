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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DamageType } from '@/types/damage.types';
import { useEffect } from 'react';

const damageSchema = z.object({
    type: z.enum(['scratch', 'dent', 'broken', 'crack', 'rust', 'paint_chip', 'other']),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string().optional(),
});

type DamageFormData = z.infer<typeof damageSchema>;

interface DamageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: DamageFormData) => void;
}

const damageTypes: { value: DamageType; label: string }[] = [
    { value: 'scratch', label: 'Arranhão' },
    { value: 'dent', label: 'Amassado' },
    { value: 'broken', label: 'Quebrado' },
    { value: 'crack', label: 'Trincado' },
    { value: 'rust', label: 'Ferrugem' },
    { value: 'paint_chip', label: 'Lasca de Tinta' },
    { value: 'other', label: 'Outro' },
];

export function DamageDialog({ open, onOpenChange, onSubmit }: DamageDialogProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<DamageFormData>({
        resolver: zodResolver(damageSchema),
        defaultValues: {
            severity: 'low',
        },
    });

    useEffect(() => {
        if (open) {
            reset();
        }
    }, [open, reset]);

    const handleFormSubmit = (data: DamageFormData) => {
        onSubmit(data);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Avaria</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* Tipo de Avaria */}
                    <div>
                        <label htmlFor="dd-type" className="block text-sm font-medium mb-2">Tipo de Avaria</label>
                        <Select
                            onValueChange={(value) => setValue('type', value as DamageType)}
                            defaultValue={watch('type')}
                        >
                            <SelectTrigger id="dd-type">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {damageTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.type && (
                            <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                        )}
                    </div>

                    {/* Gravidade */}
                    <div>
                        <label htmlFor="dd-severity" className="block text-sm font-medium mb-2">Gravidade</label>
                        <Select
                            onValueChange={(value) => setValue('severity', value as 'low' | 'medium' | 'high')}
                            defaultValue={watch('severity')}
                        >
                            <SelectTrigger id="dd-severity">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Baixa</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Descrição */}
                    <div className="grid gap-2">
                        <label htmlFor="dd-description" className="text-sm font-medium">Descrição (opcional)</label>
                        <Textarea
                            id="dd-description"
                            placeholder="Ex: Arranhão de 10cm na porta traseira esquerda..."
                            rows={3}
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600">{errors.description.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Adicionar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
