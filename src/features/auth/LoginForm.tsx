import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            await login(data);

            // useAuth já gerencia toda a navegação:
            // - must_change_password: true -> /change-password
            // - must_change_password: false -> não faz nada aqui, deixa o usuário navegar
            // Não fazemos navigate aqui para evitar conflito
        } catch (err: any) {
            console.error("Login failed", err);
            // Error handling is also done in useAuth with toast
            setError('Falha no login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">AEMS Login</CardTitle>
                <CardDescription>
                    Entre com seu usuário e senha para acessar o sistema.
                </CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="admin@aems.com.br" {...form.register('email')} />
                        {form.formState.errors.email && (
                            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Senha</Label>
                            <Link to="/forgot-password" className="text-sm text-primary hover:underline text-blue-600">
                                Esqueceu sua senha?
                            </Link>
                        </div>
                        <Input id="password" type="password" {...form.register('password')} />
                        {form.formState.errors.password && (
                            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Entrar
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
