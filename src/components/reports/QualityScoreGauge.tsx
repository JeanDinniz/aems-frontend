import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
    score: number; // 0-100
    title?: string;
    className?: string;
}

import { memo } from 'react';

// ... imports

export const QualityScoreGauge = memo(function QualityScoreGauge({
    score,
    title = 'Score de Qualidade',
    className
}: Props) {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-blue-600';
        if (score >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'Excelente';
        if (score >= 75) return 'Bom';
        if (score >= 60) return 'Regular';
        return 'Ruim';
    };

    const getScoreBg = (score: number) => {
        if (score >= 90) return 'bg-green-100';
        if (score >= 75) return 'bg-blue-100';
        if (score >= 60) return 'bg-orange-100';
        return 'bg-red-100';
    };

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-6">
                    {/* Circular Progress */}
                    <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90">
                            {/* Background circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                                fill="none"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                                className={cn('transition-all duration-500', getScoreColor(score))}
                                strokeLinecap="round"
                            />
                        </svg>
                        {/* Score text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={cn('text-3xl font-bold', getScoreColor(score))}>
                                {score.toFixed(0)}
                            </span>
                        </div>
                    </div>

                    {/* Label */}
                    <div className={cn(
                        'mt-4 px-4 py-1 rounded-full text-sm font-medium',
                        getScoreBg(score),
                        getScoreColor(score)
                    )}>
                        {getScoreLabel(score)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
