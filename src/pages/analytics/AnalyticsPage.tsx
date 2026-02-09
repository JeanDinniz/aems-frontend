import { Navigate } from 'react-router-dom';

export default function AnalyticsPage() {
    // Redirecionar para ranking de performance
    return <Navigate to="/reports/ranking" replace />;
}
