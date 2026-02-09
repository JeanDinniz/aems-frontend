import { Card, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import type { ApprovalStats } from '@/types/purchase-requests.types';

interface ApprovalStatsCardsProps {
    stats: ApprovalStats;
}

export function ApprovalStatsCards({ stats }: ApprovalStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Pendentes */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pendentes</p>
                            <p className="text-3xl font-bold">{stats.totalPending}</p>
                        </div>
                        <Clock className="h-10 w-10 text-blue-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Valor Total */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-3xl font-bold">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(stats.totalValue)}
                            </p>
                        </div>
                        <DollarSign className="h-10 w-10 text-green-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Urgentes */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Urgentes</p>
                            <p className="text-3xl font-bold text-orange-600">
                                {stats.urgentCount}
                            </p>
                        </div>
                        <AlertTriangle className="h-10 w-10 text-orange-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Taxa de Aprovação */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Taxa Aprovação</p>
                            <p className="text-3xl font-bold">{stats.approvalRate}%</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-purple-500" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
