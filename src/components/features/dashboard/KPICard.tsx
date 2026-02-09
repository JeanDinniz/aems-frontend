import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Car, DollarSign, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: number;
    format?: 'number' | 'currency' | 'percent';
    subtitle?: string;
    trend?: number;
    icon?: 'car' | 'dollar' | 'zap' | 'heart';
}

const icons = {
    car: Car,
    dollar: DollarSign,
    zap: Zap,
    heart: Heart,
};

const iconColors = {
    car: 'text-blue-500',
    dollar: 'text-green-500',
    zap: 'text-yellow-500',
    heart: 'text-red-500',
};

export function KPICard({ title, value, format = 'number', subtitle, trend, icon }: KPICardProps) {
    const Icon = icon ? icons[icon] : null;

    const formattedValue = () => {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                }).format(value);
            case 'percent':
                return `${value.toFixed(1)}%`;
            default:
                return value.toString();
        }
    };

    const trendIsPositive = trend !== undefined && trend >= 0;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">{title}</p>
                        <p className="text-3xl font-bold">{formattedValue()}</p>
                        {subtitle && (
                            <div className="flex items-center gap-1 text-sm">
                                {trend !== undefined && (
                                    <>
                                        {trendIsPositive ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                        )}
                                    </>
                                )}
                                <span
                                    className={cn(
                                        trend !== undefined && (trendIsPositive ? 'text-green-600' : 'text-red-600')
                                    )}
                                >
                                    {subtitle}
                                </span>
                            </div>
                        )}
                    </div>
                    {Icon && <Icon className={cn('h-10 w-10', icon && iconColors[icon])} />}
                </div>
            </CardContent>
        </Card>
    );
}
