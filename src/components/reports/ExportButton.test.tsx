import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { ExportButton } from './ExportButton';
import { reportsService } from '@/services/api/reports.service';
import { ReportType } from '@/types/reports.types';

vi.mock('@/services/api/reports.service');

describe('ExportButton', () => {
    const mockFilters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.URL
        (globalThis as any).URL.createObjectURL = vi.fn(() => 'mock-url');
        (globalThis as any).URL.revokeObjectURL = vi.fn();
    });

    it('should render export button with dropdown', async () => {
        const user = userEvent.setup();
        render(
            <ExportButton
                reportType={ReportType.EXECUTIVE_DASHBOARD}
                filters={mockFilters}
            />
        );

        const button = screen.getByRole('button', { name: 'Menu de exportação de relatório' });
        expect(button).toBeInTheDocument();

        await user.click(button);

        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
        expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
        expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
    });

    it('should trigger PDF export and download file', async () => {
        const user = userEvent.setup();
        const mockBlob = new Blob(['test'], { type: 'application/pdf' });
        vi.mocked(reportsService.exportReport).mockResolvedValue(mockBlob);

        render(
            <ExportButton
                reportType={ReportType.EXECUTIVE_DASHBOARD}
                filters={mockFilters}
            />
        );

        const button = screen.getByRole('button', { name: 'Menu de exportação de relatório' });
        await user.click(button);

        const pdfOption = screen.getByText('Exportar PDF');
        await user.click(pdfOption);

        await waitFor(() => {
            expect(reportsService.exportReport).toHaveBeenCalledWith({
                report_type: ReportType.EXECUTIVE_DASHBOARD,
                export_format: 'pdf',
                ...mockFilters,
            });
        });

        expect((globalThis as any).URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
        expect((globalThis as any).URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should show loading state during export', async () => {
        const user = userEvent.setup();
        vi.mocked(reportsService.exportReport).mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(
            <ExportButton
                reportType={ReportType.EXECUTIVE_DASHBOARD}
                filters={mockFilters}
            />
        );

        const button = screen.getByRole('button', { name: 'Menu de exportação de relatório' });
        await user.click(button);

        const pdfOption = screen.getByText('Exportar PDF');
        await user.click(pdfOption);

        expect(screen.getByText('Exportando...')).toBeInTheDocument();
    });

    it('should handle export error gracefully', async () => {
        const user = userEvent.setup();
        vi.mocked(reportsService.exportReport).mockRejectedValue(
            new Error('Export failed')
        );

        render(
            <ExportButton
                reportType={ReportType.EXECUTIVE_DASHBOARD}
                filters={mockFilters}
            />
        );

        const button = screen.getByRole('button', { name: 'Menu de exportação de relatório' });
        await user.click(button);

        const pdfOption = screen.getByText('Exportar PDF');
        await user.click(pdfOption);

        await waitFor(() => {
            expect(screen.getByText(/erro ao exportar/i)).toBeInTheDocument();
        });
    });

    it('should be disabled when disabled prop is true', () => {
        const { container } = render(
            <ExportButton
                reportType={ReportType.EXECUTIVE_DASHBOARD}
                filters={mockFilters}
                disabled={true}
            />
        );

        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
    });
});
