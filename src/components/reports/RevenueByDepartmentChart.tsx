import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    data: Record<string, number>;
    title?: string;
}

export function RevenueByDepartmentChart({
    data,
    title = 'Faturamento por Departamento'
}: Props) {
    const chartData = Object.entries(data).map(([department, revenue]) => ({
        department: department,
        revenue: revenue
    }));

    if (chartData.length === 0) {
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
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis
                            tickFormatter={(value) =>
                                new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    notation: 'compact'
                                }).format(value)
                            }
                        />
                        <Tooltip
                            formatter={(value) =>
                                new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(Number(value))
                            }
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3b82f6" name="Faturamento" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
