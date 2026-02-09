import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOccurrences } from '@/hooks/useOccurrences';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import { OccurrenceCard } from '@/components/occurrences/OccurrenceCard';
import type { OccurrenceFilters } from '@/types/occurrence.types';
import { OccurrenceType as OccurrenceTypeEnum } from '@/types/occurrence.types';
import { OccurrenceSeverity } from '@/types/occurrence.types';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';

import { PaginationControls } from '@/components/common/PaginationControls';

export default function OccurrencesListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [filters, setFilters] = useLocalStorage<OccurrenceFilters>('occurrences-filters', {});
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const { occurrences, total, isLoading, error } = useOccurrences(filters);

    // Filtrar localmente por texto da descrição (ou implementar no backend)
    const filteredOccurrences = occurrences.filter(occ =>
        debouncedSearch ? occ.description.toLowerCase().includes(debouncedSearch.toLowerCase()) : true
    );

    // Paginação
    const totalPages = Math.ceil(filteredOccurrences.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOccurrences = filteredOccurrences.slice(startIndex, startIndex + itemsPerPage);

    // Reset para página 1 quando filtros mudarem
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filters]);

    const handleFilterChange = <K extends keyof OccurrenceFilters>(
        key: K,
        value: OccurrenceFilters[K] | 'all'
    ) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? undefined : value
        }));
    };

    // Apenas Supervisor e Owner podem criar ocorrências
    const canCreate = user?.role === 'supervisor' || user?.role === 'owner';

    if (isLoading) {
        return (
            <div
                className="flex h-screen items-center justify-center"
                role="status"
                aria-live="polite"
            >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="sr-only">Carregando ocorrências...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <p className="text-red-500">Erro ao carregar ocorrências</p>
                <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ocorrências de RH</h1>
                    <p className="text-muted-foreground">
                        Gerencie faltas, atrasos, advertências e suspensões.
                    </p>
                </div>
                {canCreate && (
                    <Button onClick={() => navigate('/hr/occurrences/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Ocorrência
                    </Button>
                )}
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros e Busca
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por descrição..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        {/* Tipo de Ocorrência */}
                        <Select
                            value={filters.occurrence_type || 'all'}
                            onValueChange={(value) => handleFilterChange('occurrence_type', value as OccurrenceTypeEnum | 'all')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                <SelectItem value={OccurrenceTypeEnum.ABSENCE}>Falta</SelectItem>
                                <SelectItem value={OccurrenceTypeEnum.LATE_ARRIVAL}>Atraso</SelectItem>
                                <SelectItem value={OccurrenceTypeEnum.WARNING}>Advertência</SelectItem>
                                <SelectItem value={OccurrenceTypeEnum.SUSPENSION}>Suspensão</SelectItem>
                                <SelectItem value={OccurrenceTypeEnum.OTHER}>Outro</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Severidade */}
                        <Select
                            value={filters.severity || 'all'}
                            onValueChange={(value) => handleFilterChange('severity', value as OccurrenceSeverity | 'all')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Severidade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as severidades</SelectItem>
                                <SelectItem value={OccurrenceSeverity.LOW}>Baixa</SelectItem>
                                <SelectItem value={OccurrenceSeverity.MEDIUM}>Média</SelectItem>
                                <SelectItem value={OccurrenceSeverity.HIGH}>Alta</SelectItem>
                                <SelectItem value={OccurrenceSeverity.CRITICAL}>Crítica</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Reconhecimento */}
                        <Select
                            value={filters.acknowledged !== undefined ? String(filters.acknowledged) : 'all'}
                            onValueChange={(value) => handleFilterChange('acknowledged', value === 'all' ? undefined : value === 'true')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Reconhecimento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="false">Pendente</SelectItem>
                                <SelectItem value="true">Reconhecida</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Período */}
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={filters.start_date || ''}
                                onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                                placeholder="Data inicial"
                                className="w-full"
                            />
                            <Input
                                type="date"
                                value={filters.end_date || ''}
                                onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
                                placeholder="Data final"
                                className="w-full"
                            />
                        </div>

                        {/* Limpar Filtros */}
                        {(filters.occurrence_type || filters.severity || filters.acknowledged !== undefined || filters.start_date || filters.end_date) && (
                            <div className="flex items-end md:col-span-5 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFilters({});
                                        setSearch('');
                                    }}
                                >
                                    Limpar Filtros
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Ocorrências */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        {filteredOccurrences.length} de {total} ocorrências
                    </p>
                </div>

                {filteredOccurrences.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            Nenhuma ocorrência encontrada.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedOccurrences.map((occurrence) => (
                                <OccurrenceCard key={occurrence.id} occurrence={occurrence} />
                            ))}
                        </div>

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                className="mt-8"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
