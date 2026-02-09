import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página não encontrada</h2>
            <p className="text-gray-500 mb-8">
                A página que você está procurando não existe ou foi movida.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
                Voltar para o Dashboard
            </Button>
        </div>
    );
}
