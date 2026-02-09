import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DashboardAlert } from '@/types/dashboard.types';

interface AlertsCardProps {
    alerts: DashboardAlert[];
}

const alertIcons = {
    delayed_orders: Clock,
    low_stock: Package,
    pending_approvals: AlertTriangle,
};

const severityColors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    medium: 'bg-orange-100 text-orange-800 border-orange-300',
    high: 'bg-red-100 text-red-800 border-red-300',
};

export function AlertsCard({ alerts }: AlertsCardProps) {
    const navigate = useNavigate();

    return (
        <Card className="border-orange-300 bg-orange-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas Importantes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {alerts.map((alert) => {
                        const Icon = alertIcons[alert.type];
                        return (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-lg border-2 ${severityColors[alert.severity]}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <Icon className="h-5 w-5 mt-0.5" />
                                        <div>
                                            <p className="font-semibold">{alert.title}</p>
                                            <p className="text-sm">{alert.description}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{alert.count}</Badge>
                                </div>
                                {alert.link && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="mt-2 p-0 h-auto"
                                        onClick={() => navigate(alert.link!)}
                                    >
                                        Ver detalhes →
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
