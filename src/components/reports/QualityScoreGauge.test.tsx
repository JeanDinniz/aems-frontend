import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { QualityScoreGauge } from './QualityScoreGauge';

describe('QualityScoreGauge', () => {
    it('should render with score', () => {
        render(<QualityScoreGauge score={85} />);

        expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('should display "Excelente" for score >= 90', () => {
        render(<QualityScoreGauge score={95} />);

        expect(screen.getByText('Excelente')).toBeInTheDocument();
    });

    it('should display "Bom" for score >= 75 and < 90', () => {
        render(<QualityScoreGauge score={80} />);

        expect(screen.getByText('Bom')).toBeInTheDocument();
    });

    it('should display "Regular" for score >= 60 and < 75', () => {
        render(<QualityScoreGauge score={65} />);

        expect(screen.getByText('Regular')).toBeInTheDocument();
    });

    it('should display "Ruim" for score < 60', () => {
        render(<QualityScoreGauge score={50} />);

        expect(screen.getByText('Ruim')).toBeInTheDocument();
    });

    it('should use green color for excellent score', () => {
        render(<QualityScoreGauge score={95} />);

        const badge = screen.getByText('Excelente');
        expect(badge).toHaveClass('text-green-600');
    });

    it('should use custom title when provided', () => {
        render(<QualityScoreGauge score={85} title="Qualidade Geral" />);

        expect(screen.getByText('Qualidade Geral')).toBeInTheDocument();
    });

    it('should round score to nearest integer', () => {
        render(<QualityScoreGauge score={87.6} />);

        expect(screen.getByText('88')).toBeInTheDocument();
    });
});
