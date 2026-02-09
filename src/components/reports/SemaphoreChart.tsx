import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SemaphoreDistribution } from '@/types/reports.types';

interface Props {
    data: SemaphoreDistribution;
    title?: string;
}

const COLORS = {
    white: '#ffffff',
    yellow: '#fbbf24',
    orange: '#f97316',
    red: '#ef4444'
};

const LABELS = {
    white: 'Branco',
    yellow: 'Amarelo',
    orange: 'Laranja',
    red: 'Vermelho'
};

export function SemaphoreChart({ data, title = 'Distribuição do Semáforo' }: Props) {
    const chartData = [
        { name: LABELS.white, value: data.white, color: COLORS.white },
        { name: LABELS.yellow, value: data.yellow, color: COLORS.yellow },
        { name: LABELS.orange, value: data.orange, color: COLORS.orange },
        { name: LABELS.red, value: data.red, color: COLORS.red }
    ].filter(item => item.value > 0);

    const total = data.white + data.yellow + data.orange + data.red;

    if (total === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center text-gray-500">
                    Sem dados disponíveis
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="#000"
                                    strokeWidth={entry.name === LABELS.white ? 1 : 0}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
