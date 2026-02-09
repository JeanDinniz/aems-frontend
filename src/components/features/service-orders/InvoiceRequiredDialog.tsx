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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface InvoiceRequiredDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (invoiceNumber: string) => void;
    isSubmitting?: boolean;
}

export function InvoiceRequiredDialog({
    open,
    onOpenChange,
    onConfirm,
    isSubmitting = false
}: InvoiceRequiredDialogProps) {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (!invoiceNumber.trim()) {
            setError('O número da nota fiscal é obrigatório.');
            return;
        }
        onConfirm(invoiceNumber);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nota Fiscal Obrigatória</DialogTitle>
                    <DialogDescription>
                        Para serviços de película, é obrigatório informar o número da Nota Fiscal antes de finalizar como Pronto.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoice">Número da NF</Label>
                        <Input
                            id="invoice"
                            placeholder="Digite o número da NF..."
                            value={invoiceNumber}
                            onChange={(e) => {
                                setInvoiceNumber(e.target.value);
                                if (error) setError('');
                            }}
                        />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar e Finalizar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
