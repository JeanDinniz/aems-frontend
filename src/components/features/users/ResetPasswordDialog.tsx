import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/useUsers';
import type { User } from '@/types/user.types';

interface ResetPasswordDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
    const { resetPassword } = useUsers();

    const handleConfirm = () => {
        resetPassword(user.id, {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Resetar Senha</DialogTitle>
                    <DialogDescription>
                        Deseja gerar uma nova senha temporária para <strong>{user.full_name}</strong>?
                        <br />
                        A nova senha será exibida na tela e <strong>não poderá ser recuperada depois</strong> se não for salva.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm}>
                        Confirmar Reset
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
