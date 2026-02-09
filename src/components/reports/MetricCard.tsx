import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;      // Percentual (ex: 12.5 = +12.5%)
        isPositive: boolean;
    };
    className?: string;
}

export function MetricCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className
}: Props) {
    return (
        <Card className={cn('', className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <Icon className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                )}
                {trend && (
                    <div className={cn(
                        'flex items-center gap-1 text-xs font-medium mt-2',
                        trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}>
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value).toFixed(1)}%</span>
                        <span className="text-gray-500">vs período anterior</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
