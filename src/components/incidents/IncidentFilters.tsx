import { IncidentStatus, IncidentPriority, IncidentCategory } from '@/types/incident.types';
import type { IncidentFilters } from '@/types/incident.types';
// Using standard HTML select for simplicity and robustness in this specific interaction
// or could use shadcn components. 
// Let's use shadcn components for a premium feel as requested, assuming they work standardly.
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, Filter } from 'lucide-react';

interface Props {
    filters: IncidentFilters;
    onChange: (filters: IncidentFilters) => void;
    onReset: () => void;
}

export function IncidentFiltersComponent({ filters, onChange, onReset }: Props) {

    const updateFilter = (key: keyof IncidentFilters, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <Filter className="w-4 h-4" />
                <span>Filtros Avançados</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar por título ou ID..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>

                {/* Status */}
                <Select
                    value={filters.status || 'all'}
                    onValueChange={(val) => updateFilter('status', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        {Object.values(IncidentStatus).map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Priority */}
                <Select
                    value={filters.priority || 'all'}
                    onValueChange={(val) => updateFilter('priority', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Prioridades</SelectItem>
                        {Object.values(IncidentPriority).map((priority) => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Category */}
                <Select
                    value={filters.category || 'all'}
                    onValueChange={(val) => updateFilter('category', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Categorias</SelectItem>
                        {Object.values(IncidentCategory).map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                    className="gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Limpar Filtros
                </Button>
            </div>
        </div>
    );
}
