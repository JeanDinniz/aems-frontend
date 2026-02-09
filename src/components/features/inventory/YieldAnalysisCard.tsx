import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useYieldStats } from '@/hooks/useFilmBobbins';
import { Skeleton } from '@/components/ui/skeleton';

interface YieldAnalysisCardProps {
    bobbinId: number;
}

export function YieldAnalysisCard({ bobbinId }: YieldAnalysisCardProps) {
    const { data: stats, isLoading } = useYieldStats(bobbinId);

    if (isLoading) {
        return <Skeleton className="h-[200px] w-full" />;
    }

    if (!stats) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'above': return 'text-green-600';
            case 'below': return 'text-red-600';
            default: return 'text-blue-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'above': return <TrendingUp className="h-4 w-4" />;
            case 'below': return <TrendingDown className="h-4 w-4" />;
            default: return <Minus className="h-4 w-4" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'above': return 'Acima do Esperado';
            case 'below': return 'Abaixo do Esperado';
            default: return 'Dentro do Esperado';
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Análise de Rendimento</CardTitle>
                    <Badge variant="outline" className={`${getStatusColor(stats.status)} flex items-center gap-1`}>
                        {getStatusIcon(stats.status)}
                        {getStatusLabel(stats.status)}
                    </Badge>
                </div>
                <CardDescription>Performance baseada na metragem consumida vs esperada</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Yield (Aproveitamento)</span>
                            <span className="font-bold text-xl">{stats.total_yield}%</span>
                        </div>
                        <Progress value={Math.min(stats.total_yield, 100)} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase">Meta</span>
                            <p className="font-medium">{stats.target}%</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase">Faixa Esperada</span>
                            <p className="font-medium">{stats.min_expected}% - {stats.max_expected}%</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
