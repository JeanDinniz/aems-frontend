import { AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useBobbinAlerts } from '@/hooks/useFilmBobbins';
import { useStores } from '@/hooks/useStores';
import { Loader2 } from 'lucide-react';

export function BobbinAlertsPanel() {
    const { selectedStoreId } = useStores();
    const { data: alerts, isLoading } = useBobbinAlerts(selectedStoreId || undefined);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Expecting alerts to be an array of BobbinAlert. If it comes wrappped, adjust.
    // Based on service: return response.data. Assuming response.data is BobbinAlert[] or { alerts: ... }
    // My service mock said: // Expecting { alerts: BobbinAlert[] } or BobbinAlert[]
    // I should probably handle both or check what backend actually returns. 
    // Since I am mocking data or defining contract, let's assume array for now or check backend.
    // I'll assume it's an array based on my typings.
    const alertList = Array.isArray(alerts) ? alerts : (alerts as any)?.alerts || [];
    const criticalCount = alertList.filter(a => a.alert_level === 'critical').length;

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${criticalCount > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                    Alertas de Estoque
                </CardTitle>
                {alertList.length > 0 && <Badge variant="secondary">{alertList.length}</Badge>}
            </CardHeader>
            <CardContent className="flex-1 min-h-[100px]">
                {alertList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-4 text-sm">
                        <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                        <p>Nenhum alerta de estoque.</p>
                    </div>
                ) : (
                    <div className="h-[200px] overflow-y-auto -mr-4 pr-4">
                        <div className="space-y-3">
                            {alertList.map((alert: any) => (
                                <div key={alert.id} className="flex items-start justify-between space-x-2 border-b last:border-0 pb-2 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {alert.film_name || alert.smart_id}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Restante: <span className={alert.alert_level === 'critical' ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                                                {alert.current_meters.toFixed(1)}m ({alert.percentage_remaining.toFixed(0)}%)
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {alert.store_name}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                        <Link to={`/inventory/${alert.id}`}>
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
