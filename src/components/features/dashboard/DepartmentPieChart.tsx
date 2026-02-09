import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DepartmentData } from '@/types/dashboard.types';

interface DepartmentPieChartProps {
    data: DepartmentData[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export function DepartmentPieChart({ data }: DepartmentPieChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>O.S. por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="count"
                            nameKey="department"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                return `${(percent * 100).toFixed(0)}%`;
                            }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
