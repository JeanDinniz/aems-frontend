import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/api/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import { logger } from '@/lib/logger';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirmação de senha deve ter no mínimo 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, isLoading: authLoading } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    if (authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        setTimeout(() => navigate('/login'), 0);
        return null;
    }

    // Se usuário existe mas NÃO precisa trocar senha, manda para ordens de serviço
    if (!user.must_change_password) {
        setTimeout(() => navigate('/service-orders'), 0);
        return null;
    }

    const onSubmit = async (data: ChangePasswordFormData) => {
        setIsSubmitting(true);
        try {
            await authService.changePassword(data.currentPassword, data.newPassword);

            toast({
                title: 'Senha alterada com sucesso',
                description: 'Faça login novamente com sua nova senha.',
            });

            // Logout forçado após troca de senha para limpar estado "must_change_password"
            await authService.logout();
            navigate('/login');

        } catch (err) {
            logger.error('Erro ao alterar senha:', err);
            toast({
                title: 'Erro ao alterar senha',
                description: getApiErrorMessage(err as Error, 'Ocorreu um erro ao tentar alterar a senha.'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Troca de Senha Obrigatória</CardTitle>
                    <CardDescription>
                        Por segurança, você deve alterar sua senha antes de continuar.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Senha Atual</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                {...form.register('currentPassword')}
                            />
                            {form.formState.errors.currentPassword && (
                                <p className="text-sm text-red-500">{form.formState.errors.currentPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nova Senha</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                {...form.register('newPassword')}
                            />
                            {form.formState.errors.newPassword && (
                                <p className="text-sm text-red-500">{form.formState.errors.newPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...form.register('confirmPassword')}
                            />
                            {form.formState.errors.confirmPassword && (
                                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Alterar Senha
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
