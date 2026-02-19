import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/api/users.service';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface WorkerAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: number;
    onConfirm: (workerIds: number[], primaryWorkerId: number) => void;
    isSubmitting?: boolean;
}

export function WorkerAssignmentDialog({
    open,
    onOpenChange,
    storeId,
    onConfirm,
    isSubmitting = false
}: WorkerAssignmentDialogProps) {
    const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
    const [primaryWorker, setPrimaryWorker] = useState<string | null>(null);

    // Fetch operators for this store
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users', 'operators', storeId],
        queryFn: () => usersService.list({ role: 'operator', storeId, status: 'active' }, 1, 100),
        enabled: open && !!storeId
    });

    const operators = usersData?.users || [];

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setSelectedWorkers([]);
            setPrimaryWorker(null);
        }
    }, [open]);

    const handleToggleWorker = (workerId: number) => {
        setSelectedWorkers(prev => {
            if (prev.includes(workerId)) {
                const newSelection = prev.filter(id => id !== workerId);
                // If we removed the primary worker, reset primary
                if (primaryWorker === workerId.toString()) {
                    setPrimaryWorker(null);
                }
                return newSelection;
            } else {
                return [...prev, workerId];
            }
        });
    };

    const handleConfirm = () => {
        if (selectedWorkers.length === 0 || !primaryWorker) return;
        onConfirm(selectedWorkers, parseInt(primaryWorker));
    };

    const isValid = selectedWorkers.length > 0 && !!primaryWorker;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Atribuir Funcionários</DialogTitle>
                    <DialogDescription>
                        Selecione quem irá trabalhar nesta Ordem de Serviço e defina o responsável principal.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : operators.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            Nenhum operador ativo encontrado nesta loja.
                        </p>
                    ) : (
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                <RadioGroup value={primaryWorker || ''} onValueChange={setPrimaryWorker}>
                                    {operators.map((operator) => {
                                        const isSelected = selectedWorkers.includes(operator.id);
                                        return (
                                            <div key={operator.id} className={`flex items-start space-x-3 p-2 rounded-md transition-colors ${isSelected ? 'bg-muted/50' : ''}`}>
                                                <Checkbox
                                                    id={`worker-${operator.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggleWorker(operator.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label
                                                            htmlFor={`worker-${operator.id}`}
                                                            className="font-medium cursor-pointer"
                                                        >
                                                            {operator.name}
                                                        </Label>
                                                        {selectedWorkers.includes(operator.id) && (
                                                            <div className="flex items-center space-x-1 ml-auto">
                                                                <RadioGroupItem value={operator.id.toString()} id={`primary-${operator.id}`} />
                                                                <Label htmlFor={`primary-${operator.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                                                    Principal
                                                                </Label>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {operator.email}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={!isValid || isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar e Iniciar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
