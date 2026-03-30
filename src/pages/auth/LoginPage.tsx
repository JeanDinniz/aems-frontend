import { Sparkles, Shield, Zap } from 'lucide-react';
import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex bg-zinc-950 overflow-hidden">
            {/* Left side — branding panel (desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col items-center justify-center p-12 overflow-hidden">
                {/* Background gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 30% 20%, #FCAF16 0%, transparent 50%), radial-gradient(circle at 70% 80%, #FCAF16 0%, transparent 40%)',
                    }}
                />

                {/* Decorative grid */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage:
                            'linear-gradient(#FCAF16 1px, transparent 1px), linear-gradient(90deg, #FCAF16 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Decorative glowing circle */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full opacity-5 blur-3xl"
                    style={{ backgroundColor: '#FCAF16' }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                    {/* Brand logo */}
                    <img
                        src="/brand/logo-white.png"
                        alt="Wash Center"
                        className="w-64 xl:w-72 object-contain drop-shadow-2xl mb-10"
                    />

                    {/* Feature highlights */}
                    <div className="mt-2 grid grid-cols-1 gap-4 w-full max-w-xs">
                        {[
                            { icon: Shield, label: 'Seguro e confiável' },
                            { icon: Zap, label: 'Rápido e eficiente' },
                            { icon: Sparkles, label: 'Interface moderna' },
                        ].map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                            >
                                <div
                                    className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                                    style={{ backgroundColor: 'rgba(252, 175, 22, 0.15)' }}
                                >
                                    <Icon className="w-4 h-4" style={{ color: '#FCAF16' }} />
                                </div>
                                <span className="text-zinc-300 text-sm font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom attribution */}
                <p className="absolute bottom-8 text-zinc-600 text-xs z-10">
                    &copy; {new Date().getFullYear()} Wash Center. Todos os direitos reservados.
                </p>
            </div>

            {/* Right side — form panel */}
            <div className="flex w-full lg:w-1/2 xl:w-2/5 items-center justify-center p-6 sm:p-10 bg-zinc-950">
                <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Mobile logo (only visible below lg) */}
                    <div className="flex flex-col items-center mb-8 lg:hidden">
                        <img
                            src="/brand/logo-white.png"
                            alt="Wash Center"
                            className="w-48 object-contain mb-2"
                        />
                    </div>

                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
