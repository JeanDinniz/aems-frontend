import { Navigate } from 'react-router-dom';

export function BIDashboardPage() {
    // Redirecionar para o dashboard executivo
    return <Navigate to="/reports/dashboard" replace />;
}
