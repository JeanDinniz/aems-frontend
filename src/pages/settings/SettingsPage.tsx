import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Configurações</h1>
                <p className="text-gray-600">Ajustes do sistema e perfil</p>
            </div>

            {/* Perfil */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações do Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm text-gray-500">Nome</Label>
                            <p className="font-medium">{user?.name || 'Não informado'}</p>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-500">Email</Label>
                            <p className="font-medium">{user?.email || 'Não informado'}</p>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-500">Cargo</Label>
                            <p className="font-medium capitalize">{user?.role || 'Não informado'}</p>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-500">Loja</Label>
                            <p className="font-medium">
                                {user?.role === 'owner' ? 'Todas as lojas' : `Loja ${user?.store_id || '-'}`}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" disabled>
                        Editar Perfil (em breve)
                    </Button>
                </CardContent>
            </Card>

            {/* Notificações */}
            <Card>
                <CardHeader>
                    <CardTitle>Notificações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Notificações por Email</Label>
                            <p className="text-sm text-gray-500">
                                Receber alertas de ocorrências e aprovações
                            </p>
                        </div>
                        <Switch id="email-notifications" disabled />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="push-notifications">Notificações Push</Label>
                            <p className="text-sm text-gray-500">
                                Alertas em tempo real no navegador
                            </p>
                        </div>
                        <Switch id="push-notifications" disabled />
                    </div>
                </CardContent>
            </Card>

            {/* Aparência */}
            <Card>
                <CardHeader>
                    <CardTitle>Aparência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="dark-mode">Modo Escuro</Label>
                            <p className="text-sm text-gray-500">
                                Alterar para tema escuro
                            </p>
                        </div>
                        <Switch id="dark-mode" disabled />
                    </div>
                </CardContent>
            </Card>

            {/* Sessão */}
            <Card>
                <CardHeader>
                    <CardTitle>Sessão e Segurança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm text-gray-500">Tempo de sessão</Label>
                        <p className="text-sm">8 horas de inatividade</p>
                    </div>
                    <Button variant="outline" disabled>
                        Alterar Senha (em breve)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
