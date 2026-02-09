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
import { useApprovals } from '@/hooks/useApprovals';
import type { PurchaseRequest } from '@/types/purchase-requests.types';

const rejectionSchema = z.object({
    notes: z.string().min(10, 'Justificativa deve ter no mínimo 10 caracteres'),
});

type RejectionForm = z.infer<typeof rejectionSchema>;

interface RejectionDialogProps {
    request: PurchaseRequest;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RejectionDialog({ request, open, onOpenChange }: RejectionDialogProps) {
    const { reject, isRejecting } = useApprovals();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<RejectionForm>({
        resolver: zodResolver(rejectionSchema),
    });

    const onSubmit = (data: RejectionForm) => {
        reject(
            { id: request.id, notes: data.notes },
            {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rejeitar Solicitação #{request.request_number}</DialogTitle>
                </DialogHeader>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                        ⚠️ Você está prestes a <strong>rejeitar</strong> esta solicitação. O
                        solicitante será notificado.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="notes" className="text-sm font-medium">Motivo da Rejeição</label>
                        <Textarea
                            id="notes"
                            placeholder="Explique o motivo da rejeição (mínimo 10 caracteres)..."
                            rows={4}
                            {...register('notes')}
                        />
                        {errors.notes && (
                            <p className="text-sm text-red-500">{errors.notes.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isRejecting}
                        >
                            {isRejecting ? 'Rejeitando...' : 'Rejeitar Solicitação'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
