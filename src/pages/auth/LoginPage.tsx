import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm">
                {/* Optional: Add Logo here */}
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-primary-600">AEMS</h1>
                    <p className="text-gray-600">Auto Estética Management System</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
