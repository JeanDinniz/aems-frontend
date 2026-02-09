import { Circle } from 'lucide-react';

interface BobbinStockStatusProps {
    nominalMetragem: number;
    currentMetragem: number;
    status: string;
    showLabel?: boolean;
    showPercentage?: boolean;
}

export function BobbinStockStatus({
    nominalMetragem,
    currentMetragem,
    status,
    showLabel = true,
    showPercentage = true
}: BobbinStockStatusProps) {
    if (status === 'finished') {
        return (
            <div className="flex items-center gap-2">
                <Circle className="h-3 w-3 fill-current text-gray-400" />
                {showLabel && <span className="text-sm text-gray-600">Finalizada</span>}
            </div>
        );
    }

    const percentage = nominalMetragem > 0 ? (currentMetragem / nominalMetragem) * 100 : 0;

    let color = 'text-green-500';
    let bgColor = 'bg-green-50';
    let label = 'Boa';

    if (percentage < 10) {
        color = 'text-red-500';
        bgColor = 'bg-red-50';
        label = 'Crítico';
    } else if (percentage < 30) {
        color = 'text-yellow-500';
        bgColor = 'bg-yellow-50';
        label = 'Baixo';
    }

    return (
        <div className="flex items-center gap-2">
            <div className={`p-1 rounded-full ${bgColor}`}>
                <Circle className={`h-3 w-3 fill-current ${color}`} />
            </div>
            {showLabel && (
                <span className="text-sm">
                    {label}
                    {showPercentage && ` (${percentage.toFixed(0)}%)`}
                </span>
            )}
        </div>
    );
}
