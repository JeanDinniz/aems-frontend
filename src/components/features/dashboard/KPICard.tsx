import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Car, DollarSign, Zap, Heart, Minus } from 'lucide-react';
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
    car:    Car,
    dollar: DollarSign,
    zap:    Zap,
    heart:  Heart,
};

const iconBg: Record<string, string> = {
    car:    'bg-blue-50 text-blue-500',
    dollar: 'bg-emerald-50 text-emerald-500',
    zap:    'bg-aems-primary-400/10 text-aems-primary-500',
    heart:  'bg-red-50 text-red-500',
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
                return value.toLocaleString('pt-BR');
        }
    };

    const trendIsPositive = trend !== undefined && trend > 0;
    const trendIsNeutral  = trend === undefined || trend === 0;

    return (
        <Card className="border-aems-neutral-150 hover:border-aems-neutral-200 hover:shadow-md transition-all duration-200">
            <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-aems-neutral-400">
                            {title}
                        </p>
                        <p className="text-3xl font-bold text-aems-neutral-700 leading-none">
                            {formattedValue()}
                        </p>
                        {subtitle && (
                            <div className="flex items-center gap-1.5 text-xs">
                                {!trendIsNeutral && (
                                    trendIsPositive
                                        ? <TrendingUp  className="h-3.5 w-3.5 text-aems-success flex-shrink-0" />
                                        : <TrendingDown className="h-3.5 w-3.5 text-aems-error  flex-shrink-0" />
                                )}
                                {trendIsNeutral && <Minus className="h-3.5 w-3.5 text-aems-neutral-300 flex-shrink-0" />}
                                <span className={cn(
                                    'leading-tight',
                                    !trendIsNeutral && (trendIsPositive ? 'text-aems-success' : 'text-aems-error'),
                                    trendIsNeutral && 'text-aems-neutral-400'
                                )}>
                                    {subtitle}
                                </span>
                            </div>
                        )}
                    </div>

                    {Icon && (
                        <div className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                            icon && iconBg[icon]
                        )}>
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
