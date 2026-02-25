import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY_EMAIL = 'aems-notify-email';
const STORAGE_KEY_PUSH = 'aems-notify-push';
const STORAGE_KEY_DARK = 'aems-dark-mode';

function readBoolFromStorage(key: string, defaultValue: boolean): boolean {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return stored === 'true';
}

function applyDarkMode(enabled: boolean): void {
    document.documentElement.classList.toggle('dark', enabled);
}

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [notifyEmail, setNotifyEmail] = useState<boolean>(() =>
        readBoolFromStorage(STORAGE_KEY_EMAIL, true)
    );
    const [notifyPush, setNotifyPush] = useState<boolean>(() =>
        readBoolFromStorage(STORAGE_KEY_PUSH, false)
    );
    const [darkMode, setDarkMode] = useState<boolean>(() =>
        readBoolFromStorage(STORAGE_KEY_DARK, false)
    );

    // Apply dark mode class on mount based on persisted value
    useEffect(() => {
        applyDarkMode(darkMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNotifyEmailChange = (checked: boolean) => {
        setNotifyEmail(checked);
        localStorage.setItem(STORAGE_KEY_EMAIL, String(checked));
    };

    const handleNotifyPushChange = (checked: boolean) => {
        setNotifyPush(checked);
        localStorage.setItem(STORAGE_KEY_PUSH, String(checked));
    };

    const handleDarkModeChange = (checked: boolean) => {
        setDarkMode(checked);
        localStorage.setItem(STORAGE_KEY_DARK, String(checked));
        applyDarkMode(checked);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
                <p className="text-muted-foreground">Ajustes do sistema e perfil</p>
            </div>

            {/* Perfil */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações do Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nome</p>
                            <p className="font-medium">{user?.full_name || 'Não informado'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{user?.email || 'Não informado'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Cargo</p>
                            <p className="font-medium capitalize">{user?.role || 'Não informado'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Loja</p>
                            <p className="font-medium">
                                {user?.role === 'owner'
                                    ? 'Todas as lojas'
                                    : `Loja ${user?.store_id || '-'}`}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/profile')}>
                        Editar Perfil
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
                            <p className="text-sm text-muted-foreground">
                                Receber alertas de ocorrências e aprovações
                            </p>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={notifyEmail}
                            onCheckedChange={handleNotifyEmailChange}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="push-notifications">Notificações Push</Label>
                            <p className="text-sm text-muted-foreground">
                                Alertas em tempo real no navegador
                            </p>
                        </div>
                        <Switch
                            id="push-notifications"
                            checked={notifyPush}
                            onCheckedChange={handleNotifyPushChange}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">Preferências salvas automaticamente</p>
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
                            <p className="text-sm text-muted-foreground">Alterar para tema escuro</p>
                        </div>
                        <Switch
                            id="dark-mode"
                            checked={darkMode}
                            onCheckedChange={handleDarkModeChange}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Sessão e Segurança */}
            <Card>
                <CardHeader>
                    <CardTitle>Sessão e Segurança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Tempo de sessão</p>
                        <p className="text-sm">8 horas de inatividade</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => navigate('/change-password')}>
                            Alterar Senha
                        </Button>
                        <Button variant="destructive" onClick={logout}>
                            Encerrar Sessão
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
