import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { WorkerRankingTable } from './WorkerRankingTable';
import type { WorkerRankingEntry } from '@/types/reports.types';

describe('WorkerRankingTable', () => {
    const mockEntries: WorkerRankingEntry[] = [
        {
            rank: 1,
            user_id: 1,
            user_name: 'João Silva',
            store_name: 'Loja 01',
            total_os: 150,
            avg_quality_score: 95.5,
            avg_completion_time_minutes: 125,
            total_score: 98.2,
        },
        {
            rank: 2,
            user_id: 2,
            user_name: 'Maria Santos',
            store_name: 'Loja 02',
            total_os: 140,
            avg_quality_score: 92.0,
            avg_completion_time_minutes: 130,
            total_score: 95.8,
        },
        {
            rank: 3,
            user_id: 3,
            user_name: 'Pedro Costa',
            store_name: 'Loja 03',
            total_os: 135,
            avg_quality_score: 90.0,
            avg_completion_time_minutes: 140,
            total_score: 93.5,
        },
    ];

    it('should render ranking table with entries', () => {
        render(<WorkerRankingTable entries={mockEntries} />);

        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
    });

    it('should display trophy icon for 1st place', () => {
        render(<WorkerRankingTable entries={mockEntries} />);

        const firstRow = screen.getByText('João Silva').closest('tr');
        expect(firstRow).toBeInTheDocument();
        // Trophy tem classe text-yellow-500
        const trophy = firstRow?.querySelector('.text-yellow-500');
        expect(trophy).toBeInTheDocument();
    });

    it('should format time correctly (hours and minutes)', () => {
        render(<WorkerRankingTable entries={mockEntries} />);

        // 125 minutes = 2h 5min
        expect(screen.getByText('2h 5min')).toBeInTheDocument();
        // 130 minutes = 2h 10min
        expect(screen.getByText('2h 10min')).toBeInTheDocument();
    });

    it('should format time correctly (only minutes)', () => {
        const shortEntry: WorkerRankingEntry[] = [
            {
                ...mockEntries[0],
                avg_completion_time_minutes: 45,
            },
        ];

        render(<WorkerRankingTable entries={shortEntry} />);

        expect(screen.getByText('45min')).toBeInTheDocument();
    });

    it('should display empty state when no entries', () => {
        render(<WorkerRankingTable entries={[]} />);

        expect(screen.getByText('Sem dados disponíveis')).toBeInTheDocument();
    });

    it('should display quality scores with 1 decimal', () => {
        render(<WorkerRankingTable entries={mockEntries} />);

        expect(screen.getByText('95.5')).toBeInTheDocument();
        expect(screen.getByText('92.0')).toBeInTheDocument();
    });

    it('should display total scores with 1 decimal', () => {
        render(<WorkerRankingTable entries={mockEntries} />);

        expect(screen.getByText('98.2')).toBeInTheDocument();
        expect(screen.getByText('95.8')).toBeInTheDocument();
    });
});
