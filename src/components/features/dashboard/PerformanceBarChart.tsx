import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { StorePerformance } from '@/types/dashboard.types';

interface PerformanceBarChartProps {
    data: StorePerformance[];
}

export function PerformanceBarChart({ data }: PerformanceBarChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance por Loja</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="storeName" />
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                        <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="ordersCompleted" name="O.S. Concluídas" fill="#3b82f6" />
                        <Bar yAxisId="right" dataKey="revenue" name="Faturamento" fill="#22c55e" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
