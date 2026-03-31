import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

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

    const [notifyPush, setNotifyPush] = useState<boolean>(() =>
        readBoolFromStorage(STORAGE_KEY_PUSH, false)
    );
    const [darkMode, setDarkMode] = useState<boolean>(() =>
        readBoolFromStorage(STORAGE_KEY_DARK, true)
    );

    // Apply dark mode class on mount based on persisted value
    useEffect(() => {
        applyDarkMode(readBoolFromStorage(STORAGE_KEY_DARK, true));
    }, []);

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
        <div className="p-6 space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1
                    className="text-3xl font-bold text-[#111111] dark:text-white"
                    style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                >
                    Configurações
                </h1>
                <p className="text-[#666666] dark:text-zinc-400 mt-1">Ajustes do sistema e perfil</p>
            </div>

            {/* Informações do Perfil */}
            <div className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] rounded-xl p-6 space-y-5">
                <h2
                    className="text-lg font-semibold text-[#111111] dark:text-white"
                    style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                >
                    Informações do Perfil
                </h2>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                        <p className="text-xs text-[#999999] dark:text-zinc-500 uppercase tracking-wide mb-0.5">Nome</p>
                        <p className="text-sm font-medium text-[#111111] dark:text-zinc-200">{user?.full_name || 'Não informado'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#999999] dark:text-zinc-500 uppercase tracking-wide mb-0.5">Email</p>
                        <p className="text-sm font-medium text-[#111111] dark:text-zinc-200">{user?.email || 'Não informado'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#999999] dark:text-zinc-500 uppercase tracking-wide mb-0.5">Cargo</p>
                        <p className="text-sm font-medium text-[#111111] dark:text-zinc-200 capitalize">{user?.role || 'Não informado'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#999999] dark:text-zinc-500 uppercase tracking-wide mb-0.5">Loja</p>
                        <p className="text-sm font-medium text-[#111111] dark:text-zinc-200">
                            {user?.role === 'owner'
                                ? 'Todas as lojas'
                                : `Loja ${user?.store_id || '-'}`}
                        </p>
                    </div>
                </div>

                <div className="pt-1">
                    <button
                        onClick={() => navigate('/profile')}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 transition-colors hover:border-[#F5A800] hover:text-[#F5A800]"
                    >
                        Editar Perfil
                    </button>
                </div>
            </div>

            {/* Notificações */}
            <div className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] rounded-xl p-6 space-y-5">
                <h2
                    className="text-lg font-semibold text-[#111111] dark:text-white"
                    style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                >
                    Notificações
                </h2>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label
                            htmlFor="push-notifications"
                            className="text-sm font-medium text-[#111111] dark:text-zinc-200 cursor-pointer"
                        >
                            Notificações Push
                        </Label>
                        <p className="text-sm text-[#666666] dark:text-zinc-500">Alertas em tempo real no navegador</p>
                    </div>
                    <Switch
                        id="push-notifications"
                        checked={notifyPush}
                        onCheckedChange={handleNotifyPushChange}
                    />
                </div>

                <p className="text-xs text-[#999999] dark:text-zinc-500">Preferências salvas automaticamente</p>
            </div>

            {/* Aparência */}
            <div className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] rounded-xl p-6 space-y-5">
                <h2
                    className="text-lg font-semibold text-[#111111] dark:text-white"
                    style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                >
                    Aparência
                </h2>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label
                            htmlFor="dark-mode"
                            className="text-sm font-medium text-[#111111] dark:text-zinc-200 cursor-pointer"
                        >
                            Modo Escuro
                        </Label>
                        <p className="text-sm text-[#666666] dark:text-zinc-500">Alterar para tema escuro</p>
                    </div>
                    <Switch
                        id="dark-mode"
                        checked={darkMode}
                        onCheckedChange={handleDarkModeChange}
                    />
                </div>
            </div>

            {/* Sessão e Segurança */}
            <div className="bg-white dark:bg-[#252525] border border-[#D1D1D1] dark:border-[#333333] rounded-xl p-6 space-y-5">
                <h2
                    className="text-lg font-semibold text-[#111111] dark:text-white"
                    style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                >
                    Sessão e Segurança
                </h2>

                <div>
                    <p className="text-xs text-[#999999] dark:text-zinc-500 uppercase tracking-wide mb-0.5">Tempo de sessão</p>
                    <p className="text-sm text-[#666666] dark:text-zinc-300">8 horas de inatividade</p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                    <button
                        onClick={() => navigate('/change-password')}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-[#D1D1D1] dark:border-[#333333] text-[#666666] dark:text-zinc-300 transition-colors hover:border-[#F5A800] hover:text-[#F5A800]"
                    >
                        Alterar Senha
                    </button>
                    <button
                        onClick={logout}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                        Encerrar Sessão
                    </button>
                </div>
            </div>
        </div>
    );
}
