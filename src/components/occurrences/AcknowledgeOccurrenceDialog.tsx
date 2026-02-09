import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAcknowledge: (notes?: string) => Promise<void>;
    isLoading?: boolean;
}

export function AcknowledgeOccurrenceDialog({
    open,
    onOpenChange,
    onAcknowledge,
    isLoading = false
}: Props) {
    const [notes, setNotes] = useState('');

    const handleSubmit = async () => {
        await onAcknowledge(notes || undefined);
        setNotes('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Reconhecer Ocorrência
                    </DialogTitle>
                    <DialogDescription>
                        Ao reconhecer esta ocorrência, você confirma que está ciente do registro.
                        Você pode adicionar comentários opcionais.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            Comentários (opcional)
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Adicione seus comentários sobre esta ocorrência..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">
                            Seus comentários serão registrados junto ao reconhecimento.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processando...' : 'Confirmar Reconhecimento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
