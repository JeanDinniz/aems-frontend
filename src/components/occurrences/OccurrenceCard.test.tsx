import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { OccurrenceCard } from './OccurrenceCard';
import { OccurrenceType, OccurrenceSeverity } from '@/types/occurrence.types';
import type { Occurrence } from '@/types/occurrence.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('OccurrenceCard', () => {
    const mockOccurrence: Occurrence = {
        id: 1,
        employee_id: 10,
        store_id: 1,
        occurrence_type: OccurrenceType.ABSENCE,
        severity: OccurrenceSeverity.MEDIUM,
        occurrence_date: '2024-01-15T12:00:00Z',
        reported_at: '2024-01-15T09:00:00Z',
        description: 'Faltou ao trabalho sem justificativa',
        reported_by_id: 2,
        acknowledged: false,
        acknowledged_at: undefined,
        acknowledged_by_id: undefined,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
    };

    it('should render occurrence details', () => {
        render(<OccurrenceCard occurrence={mockOccurrence} />);

        expect(screen.getByText('Funcionário ID: 10')).toBeInTheDocument();
        // Store name is displayed based on store_id (1 = Toyota Botafogo)
        expect(screen.getByText(/Faltou ao trabalho/)).toBeInTheDocument();
    });

    it('should display type badge', () => {
        render(<OccurrenceCard occurrence={mockOccurrence} />);

        expect(screen.getByText('Falta')).toBeInTheDocument();
    });

    it('should display severity badge', () => {
        render(<OccurrenceCard occurrence={mockOccurrence} />);

        expect(screen.getByText('Média')).toBeInTheDocument();
    });

    it('should display "Não reconhecido" badge when not acknowledged', () => {
        render(<OccurrenceCard occurrence={mockOccurrence} />);

        expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    it('should display "Reconhecido" badge when acknowledged', () => {
        const acknowledgedOccurrence: Occurrence = {
            ...mockOccurrence,
            acknowledged: true,
            acknowledged_at: '2024-01-16T10:00:00Z',
        };

        render(<OccurrenceCard occurrence={acknowledgedOccurrence} />);

        expect(screen.getByText('Reconhecida')).toBeInTheDocument();
    });

    it('should navigate to details when clicked', async () => {
        const user = userEvent.setup();
        render(<OccurrenceCard occurrence={mockOccurrence} />);

        const card = screen.getByText('Funcionário ID: 10').closest('div');
        expect(card).toBeInTheDocument();

        if (card) {
            await user.click(card);
            expect(mockNavigate).toHaveBeenCalledWith('/hr/occurrences/1');
        }
    });

    it('should format date correctly', () => {
        render(<OccurrenceCard occurrence={mockOccurrence} />);

        // Data deve estar formatada (usando date-fns com locale pt-BR)
        const dateText = screen.getByText(/15\/01\/2024/);
        expect(dateText).toBeInTheDocument();
    });
});
