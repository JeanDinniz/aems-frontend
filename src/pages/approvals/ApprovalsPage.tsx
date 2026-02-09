import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApprovalStatsCards } from '@/components/features/approvals/ApprovalStatsCards';
import { ApprovalFilters } from '@/components/features/approvals/ApprovalFilters';
import { ApprovalCard } from '@/components/features/approvals/ApprovalCard';
import { useApprovals } from '@/hooks/useApprovals';
import { useAuth } from '@/hooks/useAuth';
import type { PendingApprovalFilters } from '@/types/purchase-requests.types';

export function ApprovalsPage() {
    const [filters, setFilters] = useState<PendingApprovalFilters>({});
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const { user } = useAuth();
    const canApprove = ['supervisor', 'owner'].includes(user?.role || '');
    const { pendingRequests, stats, isLoading } = useApprovals(filters);

    if (!canApprove) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <p className="text-xl font-semibold text-red-600">
                    Acesso negado.
                </p>
                <p className="text-gray-600">
                    Apenas Supervisores e Owners podem aprovar solicitações.
                </p>
            </div>
        );
    }

    const handleBulkApprove = () => {
        // TODO: Implementar aprovação em lote (API endpoint needed)
        console.log('Bulk approve:', selectedIds);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel de Aprovações</h1>
                    <p className="text-muted-foreground">
                        Aprovar ou rejeitar solicitações de compra
                    </p>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSelectedIds([])}>
                            Desmarcar ({selectedIds.length})
                        </Button>
                        <Button onClick={handleBulkApprove}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar Selecionadas
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            {stats && <ApprovalStatsCards stats={stats} />}

            {/* Filtros */}
            <ApprovalFilters filters={filters} onFiltersChange={setFilters} />

            {/* Lista de Solicitações */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <p className="text-gray-500">Carregando solicitações...</p>
                    </div>
                ) : pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border border-dashed">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                            Nenhuma solicitação pendente
                        </h3>
                        <p className="text-gray-600">
                            Todas as solicitações foram aprovadas ou rejeitadas. Bom trabalho!
                        </p>
                    </div>
                ) : (
                    pendingRequests.map((request) => (
                        <ApprovalCard
                            key={request.id}
                            request={request}
                            isSelected={selectedIds.includes(request.id)}
                            onSelect={(selected) => {
                                if (selected) {
                                    setSelectedIds([...selectedIds, request.id]);
                                } else {
                                    setSelectedIds(selectedIds.filter((id) => id !== request.id));
                                }
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
