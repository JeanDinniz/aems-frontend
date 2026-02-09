import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Wrench, Calendar, TrendingUp } from 'lucide-react';
import type { ClientStats, Client } from '@/types/client.types';

interface ClientStatsCardsProps {
    stats?: ClientStats;
    client?: Client;
}

export function ClientStatsCards({ stats, client }: ClientStatsCardsProps) {
    if (!stats || !client) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                        }).format(stats.total_revenue || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Vitalício
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{client.total_services || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        Serviços realizados
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                        }).format((stats.total_revenue || 0) / (client.total_services || 1))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Último Serviço</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {client.last_service_date
                            ? new Date(client.last_service_date).toLocaleDateString('pt-BR')
                            : 'N/A'}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
