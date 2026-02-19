import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { User as UserIcon, Lock, Mail, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/api/auth.service';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType } from '@/types/auth.types';

const profileSchema = z.object({
    name: z.string().min(3, 'Nome muito curto'),
    phone: z.string().optional(),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Senha atual obrigatória'),
        newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Senhas não conferem',
        path: ['confirmPassword'],
    });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const roleLabels = {
    owner: 'Proprietário',
    supervisor: 'Supervisor',
    operator: 'Operador',
};

export function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const { toast } = useToast();

    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors },
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.full_name || '',
            phone: user?.phone || '',
        },
    });

    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        formState: { errors: passwordErrors },
        reset: resetPassword,
    } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: ProfileForm) => authService.updateProfile(data) as Promise<Partial<UserType>>,
        onSuccess: (updatedUser: Partial<UserType>) => {
            updateUser(updatedUser);
            toast({
                title: 'Perfil atualizado',
                description: 'Suas informações foram salvas com sucesso.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar o perfil.',
                variant: 'destructive',
            });
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: (data: PasswordForm) =>
            authService.changePassword(data.currentPassword, data.newPassword),
        onSuccess: () => {
            toast({
                title: 'Senha alterada',
                description: 'Sua senha foi atualizada com sucesso.',
            });
            resetPassword();
        },
        onError: (error: any) => {
            toast({
                title: 'Erro',
                description: error.response?.data?.message || 'Não foi possível alterar a senha.',
                variant: 'destructive',
            });
        },
    });

    if (!user) return null;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Meu Perfil</h1>
                <p className="text-gray-600">Gerencie suas informações pessoais</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Card de Informações Básicas */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-center">Informações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                                <UserIcon className="h-12 w-12 text-primary-600" />
                            </div>
                            <h2 className="text-xl font-semibold">{user.full_name}</h2>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Cargo:</span>
                                <Badge>{roleLabels[user.role]}</Badge>
                            </div>
                            {user.store_name && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Loja:</span>
                                    <span className="text-sm font-medium">{user.store_name}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Status:</span>
                                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                    {user.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs de Edição */}
                <Card className="md:col-span-2">
                    <CardContent className="pt-6">
                        <Tabs defaultValue="profile">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="profile">Dados Pessoais</TabsTrigger>
                                <TabsTrigger value="password">Alterar Senha</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="space-y-4">
                                <form
                                    onSubmit={handleSubmitProfile((data) => updateProfileMutation.mutate(data))}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nome Completo</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-9"
                                                {...registerProfile('name')}
                                            />
                                        </div>
                                        {profileErrors.name && <p className="text-sm text-red-500">{profileErrors.name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">E-mail</label>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-9"
                                                value={user.email}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Telefone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-9"
                                                placeholder="(00) 00000-0000"
                                                {...registerProfile('phone')}
                                            />
                                        </div>
                                        {profileErrors.phone && <p className="text-sm text-red-500">{profileErrors.phone.message}</p>}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={updateProfileMutation.isPending}
                                    >
                                        {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Salvar Alterações
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="password" className="space-y-4">
                                <form
                                    onSubmit={handleSubmitPassword((data) =>
                                        changePasswordMutation.mutate(data)
                                    )}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Senha Atual</label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-9"
                                                type="password"
                                                {...registerPassword('currentPassword')}
                                            />
                                        </div>
                                        {passwordErrors.currentPassword && <p className="text-sm text-red-500">{passwordErrors.currentPassword.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nova Senha</label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-9"
                                                type="password"
                                                {...registerPassword('newPassword')}
                                            />
                                        </div>
                                        {passwordErrors.newPassword && <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Confirmar Nova Senha</label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-9"
                                                type="password"
                                                {...registerPassword('confirmPassword')}
                                            />
                                        </div>
                                        {passwordErrors.confirmPassword && <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={changePasswordMutation.isPending}
                                    >
                                        {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Alterar Senha
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
