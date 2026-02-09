import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { TopInstaller } from '@/types/dashboard.types';

interface TopInstallersCardProps {
    installers: TopInstaller[];
}

export function TopInstallersCard({ installers }: TopInstallersCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 5 Instaladores</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {installers.map((installer, index) => (
                        <div key={installer.id} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                {index + 1}
                            </div>

                            <Avatar>
                                <AvatarFallback>
                                    {installer.name
                                        .split(' ')
                                        .slice(0, 2)
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <p className="font-medium">{installer.name}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{installer.ordersCompleted} O.S.</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span>{installer.averageRating.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>

                            <Badge variant="secondary">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    minimumFractionDigits: 0,
                                }).format(installer.totalRevenue)}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
