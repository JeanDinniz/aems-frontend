import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award } from 'lucide-react';
import type { WorkerRankingEntry } from '@/types/reports.types';

interface Props {
    entries: WorkerRankingEntry[];
    title?: string;
}

import { memo } from 'react';

// ... imports

export const WorkerRankingTable = memo(function WorkerRankingTable({ entries, title = 'Ranking de Performance' }: Props) {
    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
        return <span className="text-gray-500 font-medium">{rank}º</span>;
    };

    if (entries.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="py-8 text-center text-gray-500">
                    Sem dados disponíveis
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Loja</TableHead>
                            <TableHead className="text-right">Total O.S.</TableHead>
                            <TableHead className="text-right">Qualidade</TableHead>
                            <TableHead className="text-right">Tempo Médio</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map((entry) => (
                            <TableRow key={entry.user_id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center justify-center">
                                        {getRankIcon(entry.rank)}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{entry.user_name}</TableCell>
                                <TableCell className="text-gray-600">{entry.store_name}</TableCell>
                                <TableCell className="text-right">{entry.total_os}</TableCell>
                                <TableCell className="text-right">
                                    {entry.avg_quality_score.toFixed(1)}
                                </TableCell>
                                <TableCell className="text-right text-gray-600">
                                    {formatTime(entry.avg_completion_time_minutes)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-blue-600">
                                    {entry.total_score.toFixed(1)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
});

function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
        return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
}
