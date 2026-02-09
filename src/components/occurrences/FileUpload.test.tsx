import { render, screen, fireEvent } from '@/test/utils';
import { FileUpload } from './FileUpload';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('FileUpload', () => {
    const mockOnFilesChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders file upload area', () => {
        render(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />);

        expect(screen.getByText(/clique ou arraste arquivos aqui/i)).toBeInTheDocument();
        // react-dropzone input is hidden
        const input = document.querySelector('input[type="file"]');
        expect(input).toBeInTheDocument();
    });

    it('displays validation info', () => {
        render(<FileUpload files={[]} onFilesChange={mockOnFilesChange} maxFiles={3} maxSize={1024 * 1024} />);

        expect(screen.getByText(/3 restantes/i)).toBeInTheDocument();
        expect(screen.getByText(/até 1.0 MB/i)).toBeInTheDocument();
    });

    it('lists uploaded files', () => {
        const files = [
            new File(['dummy content'], 'test.png', { type: 'image/png' }),
            new File(['dummy content 2'], 'doc.pdf', { type: 'application/pdf' }),
        ];

        render(<FileUpload files={files} onFilesChange={mockOnFilesChange} />);

        expect(screen.getByText('test.png')).toBeInTheDocument();
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
        expect(screen.getByLabelText('Remover test.png')).toBeInTheDocument();
    });

    it('calls onFilesChange when removing a file', () => {
        const files = [
            new File(['dummy content'], 'test.png', { type: 'image/png' }),
        ];

        render(<FileUpload files={files} onFilesChange={mockOnFilesChange} />);

        const removeBtn = screen.getByLabelText('Remover test.png');
        fireEvent.click(removeBtn);

        expect(mockOnFilesChange).toHaveBeenCalledWith([]);
    });
});
