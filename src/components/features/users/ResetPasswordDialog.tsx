import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
                    <AlertDialogDescription>
                        Deseja gerar uma nova senha temporária para <strong>{user.full_name}</strong>?
                        <br />
                        A nova senha será exibida na tela e <strong>não poderá ser recuperada depois</strong> se não for salva.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                        Confirmar Reset
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
