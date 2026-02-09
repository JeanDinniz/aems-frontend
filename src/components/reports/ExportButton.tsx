import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { reportsService } from '@/services/api/reports.service';
import { useToast } from '@/hooks/use-toast';
import type { ExportRequest, ExportFormat, ReportType } from '@/types/reports.types';

interface Props {
    reportType: ReportType;
    filters: Omit<ExportRequest, 'export_format' | 'report_type'>;
    disabled?: boolean;
}

export function ExportButton({ reportType, filters, disabled }: Props) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const handleExport = async (format: ExportFormat) => {
        try {
            setIsExporting(true);

            const payload: ExportRequest = {
                report_type: reportType,
                export_format: format,
                ...filters
            };

            const blob = await reportsService.exportReport(payload);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
            link.download = `relatorio_${reportType}_${new Date().getTime()}.${extension}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Relatório exportado',
                description: `Arquivo ${extension.toUpperCase()} baixado com sucesso.`,
            });
        } catch (error: any) {
            console.error('Erro ao exportar:', error);

            let errorMessage = 'Não foi possível gerar o relatório.';

            if (error.response) {
                // Erros do servidor
                if (error.response.status === 500) {
                    errorMessage = 'Erro no servidor ao gerar o relatório. Tente novamente em alguns instantes.';
                } else if (error.response.status === 403) {
                    errorMessage = 'Você não tem permissão para exportar este relatório.';
                } else if (error.response.status === 400) {
                    errorMessage = error.response.data?.message || 'Parâmetros inválidos para exportação.';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.request) {
                // Erro de rede
                errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
            }

            toast({
                title: 'Erro ao exportar',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || isExporting}
                    aria-label="Menu de exportação de relatório"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exportando...' : 'Exportar'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf' as ExportFormat)} aria-label="Exportar relatório em formato PDF">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel' as ExportFormat)} aria-label="Exportar relatório em formato Excel">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv' as ExportFormat)} aria-label="Exportar relatório em formato CSV">
                    <File className="w-4 h-4 mr-2" />
                    Exportar CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
