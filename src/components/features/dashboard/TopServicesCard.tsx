import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TopService } from '@/types/dashboard.types';

interface TopServicesCardProps {
    services: TopService[];
}

export function TopServicesCard({ services }: TopServicesCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 5 Serviços</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {services.map((service, index) => (
                        <div key={service.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 font-bold w-4">{index + 1}.</span>
                                <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="text-xs text-gray-600">
                                        {service.timesOrdered} vendas
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    minimumFractionDigits: 0,
                                }).format(service.revenue)}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
