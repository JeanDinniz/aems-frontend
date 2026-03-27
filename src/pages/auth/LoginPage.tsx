import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
    return (
        <div className="h-screen flex items-center justify-center bg-[#f5f5f5] overflow-hidden">
            <div className="w-full max-w-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-primary-600">AEMS</h1>
                    <p className="text-gray-600">Auto Estética Management System</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
