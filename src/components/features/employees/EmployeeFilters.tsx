import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStores } from '@/hooks/useStores';
import type { EmployeeFilters as Filters } from '@/types/employee.types';

interface Props {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

export function EmployeeFilters({ filters, onFiltersChange }: Props) {
    const { stores } = useStores();

    const handleChange = (key: keyof Filters, value: Filters[keyof Filters]) => {
        onFiltersChange({ ...filters, [key]: value !== 'all' ? value : undefined });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <Input
                placeholder="Buscar por nome"
                value={filters.search || ''}
                onChange={(e) => handleChange('search', e.target.value || undefined)}
                className="max-w-xs"
            />

            <Select
                value={filters.store_id?.toString() || 'all'}
                onValueChange={(v) => handleChange('store_id', v === 'all' ? undefined : Number(v))}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Loja" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {stores?.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                            {store.code} - {store.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.department || 'all'}
                onValueChange={(v) => handleChange('department', v === 'all' ? undefined : v)}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os cargos</SelectItem>
                    <SelectItem value="film">Instaladores de Película</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={filters.is_active === undefined ? 'all' : filters.is_active ? 'true' : 'false'}
                onValueChange={(v) => handleChange('is_active', v === 'all' ? undefined : v === 'true')}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Ativos</SelectItem>
                    <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
