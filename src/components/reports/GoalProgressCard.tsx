import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GoalType, GoalTypeLabels } from '@/types/reports.types';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    goalType: GoalType;
    targetValue: number;
    currentValue: number;
    progressPct: number;
    remaining: number;
    storeName?: string;
    className?: string;
}

export function GoalProgressCard({
    goalType,
    targetValue,
    currentValue,
    progressPct,
    remaining,
    storeName,
    className
}: Props) {
    const isComplete = progressPct >= 100;
    const isOnTrack = progressPct >= 50; // Arbitrário: >50% = on track

    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold">
                            {GoalTypeLabels[goalType]}
                        </CardTitle>
                        {storeName && (
                            <p className="text-sm text-gray-500 mt-1">{storeName}</p>
                        )}
                    </div>
                    <Target className={cn(
                        'w-5 h-5',
                        isComplete ? 'text-green-600' : isOnTrack ? 'text-blue-600' : 'text-orange-600'
                    )} />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progresso</span>
                        <span className="font-semibold">{progressPct.toFixed(1)}%</span>
                    </div>
                    <Progress
                        value={Math.min(progressPct, 100)}
                        className={cn(
                            'h-2',
                            isComplete && '[&>div]:bg-green-500',
                            !isComplete && isOnTrack && '[&>div]:bg-blue-500',
                            !isComplete && !isOnTrack && '[&>div]:bg-orange-500'
                        )}
                    />
                </div>

                {/* Values */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                        <p className="text-gray-500">Atual</p>
                        <p className="font-semibold">{formatValue(goalType, currentValue)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Meta</p>
                        <p className="font-semibold">{formatValue(goalType, targetValue)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Restante</p>
                        <p className="font-semibold">{formatValue(goalType, remaining)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function formatValue(goalType: GoalType, value: number): string {
    if (goalType === GoalType.REVENUE) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
    if (goalType === GoalType.QUALITY_SCORE) {
        return value.toFixed(1);
    }
    return value.toString();
}
