import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Department, QualityChecklistItem } from '@/types/service-order.types';

interface QualityChecklistDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number;
    department: Department;
    onApprove: (items: QualityChecklistItem[]) => void;
    onReject: (notes: string) => void;
    isSubmitting?: boolean;
}

const CHECKLISTS: Record<Department, string[]> = {
    film: [
        "Película aplicada sem bolhas",
        "Bordas alinhadas e sem descolamento",
        "Limpeza do vidro adequada",
        "Película sem riscos ou imperfeições",
        "Corte preciso nas bordas",
        "Cura visual adequada"
    ],
    bodywork: [
        "Superfície nivelada e sem imperfeições",
        "Pintura uniforme sem marcas",
        "Sem resíduos de massa ou lixa",
        "Polimento final realizado",
        "Alinhamento dos painéis correto"
    ],
    vn: [
        "Lavagem técnica completa",
        "Remoção de proteções de transporte",
        "Verificação de pintura",
        "Calibragem de pneus",
        "Limpeza interna básica"
    ],
    vu: [
        "Lavagem detalhada",
        "Higienização interna",
        "Polimento comercial",
        "Limpeza de motor",
        "Pretinho nos pneus"
    ],
    workshop: [
        "Peças substituídas corretamente",
        "Torque dos parafusos conferido",
        "Fluídos no nível correto",
        "Ausência de vazamentos",
        "Teste de rodagem realizado"
    ]
};

export function QualityChecklistDialog({
    open,
    onOpenChange,
    orderId: _orderId,
    department,
    onApprove,
    onReject,
    isSubmitting = false
}: QualityChecklistDialogProps) {
    const defaultItems = CHECKLISTS[department] || [];
    const [items, setItems] = useState<QualityChecklistItem[]>([]);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [mode, setMode] = useState<'approve' | 'reject'>('approve');

    useEffect(() => {
        if (open) {
            setItems(defaultItems.map(label => ({ label, checked: false })));
            setRejectionNotes('');
            setMode('approve');
        }
    }, [open, department]);

    const handleToggle = (index: number) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, checked: !item.checked } : item
        ));
    };

    const allChecked = items.every(item => item.checked);

    const handleConfirm = () => {
        if (mode === 'approve' && allChecked) {
            onApprove(items);
        } else if (mode === 'reject' && rejectionNotes.trim()) {
            onReject(rejectionNotes);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Checklist de Qualidade - {department.toUpperCase()}</DialogTitle>
                    <DialogDescription>
                        Verifique os itens abaixo para aprovar o serviço.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {mode === 'approve' ? (
                        <div className="space-y-4">
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-3">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={`item-${index}`}
                                                checked={item.checked}
                                                onCheckedChange={() => handleToggle(index)}
                                                className="mt-1"
                                            />
                                            <Label
                                                htmlFor={`item-${index}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {item.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {!allChecked && (
                                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Todos os itens devem ser marcados para aprovar.
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    variant="link"
                                    className="text-red-500 h-auto p-0"
                                    onClick={() => setMode('reject')}
                                >
                                    Encontrou problemas? Reprovar serviço
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3 bg-red-50 text-red-800 text-sm rounded-md flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Você está prestes a reprovar este serviço.
                            </div>
                            <div className="space-y-2">
                                <Label>Motivo da Reprovação (Obrigatório)</Label>
                                <Textarea
                                    value={rejectionNotes}
                                    onChange={(e) => setRejectionNotes(e.target.value)}
                                    placeholder="Descreva os problemas encontrados..."
                                    className="min-h-[100px]"
                                />
                            </div>
                            <div className="pt-2">
                                <Button
                                    variant="link"
                                    onClick={() => setMode('approve')}
                                    className="p-0 h-auto"
                                >
                                    Voltar para checklist
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting || (mode === 'approve' && !allChecked) || (mode === 'reject' && !rejectionNotes.trim())}
                        variant={mode === 'reject' ? 'destructive' : 'default'}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'approve' ? 'Aprovar e Finalizar' : 'Reprovar Serviço'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
