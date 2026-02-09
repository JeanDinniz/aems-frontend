import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authService } from '@/services/api/auth.service';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
    email: z.string().email('E-mail inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [emailSent, setEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const mutation = useMutation({
        mutationFn: (data: ForgotPasswordForm) => authService.forgotPassword(data.email),
        onSuccess: () => {
            setEmailSent(true);
            toast({
                title: 'E-mail enviado',
                description: 'Verifique sua caixa de entrada para redefinir sua senha.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro',
                description: 'Não foi possível enviar o e-mail. Tente novamente.',
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (data: ForgotPasswordForm) => {
        mutation.mutate(data);
    };

    if (emailSent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle>E-mail Enviado!</CardTitle>
                        <CardDescription>
                            Enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            Voltar para Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Esqueceu a Senha?</CardTitle>
                    <CardDescription>
                        Digite seu e-mail e enviaremos instruções para redefinir sua senha.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="seu@email.com"
                                type="email"
                                {...register('email')}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Link de Recuperação
                        </Button>

                        <Link to="/login">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar para Login
                            </Button>
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
