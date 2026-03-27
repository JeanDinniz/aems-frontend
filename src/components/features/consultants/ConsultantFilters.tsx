import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ConsultantFilters as Filters } from '@/types/consultant.types';
import { useStores } from '@/hooks/useStores';

interface ConsultantFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

export function ConsultantFilters({ filters, onFiltersChange }: ConsultantFiltersProps) {
    const { stores } = useStores();

    const handleChange = (key: keyof Filters, value: Filters[keyof Filters]) => {
        onFiltersChange({ ...filters, [key]: value !== 'all' ? value : undefined });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <Input
                placeholder="Buscar por nome"
                value={filters.search || ''}
                onChange={(e) => handleChange('search', e.target.value)}
                className="max-w-xs"
            />

            <Select
                value={filters.store_id?.toString() || 'all'}
                onValueChange={(value) => handleChange('store_id', value === 'all' ? undefined : Number(value))}
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
                value={filters.is_active === undefined ? 'all' : filters.is_active ? 'true' : 'false'}
                onValueChange={(value) => handleChange('is_active', value === 'all' ? undefined : value === 'true')}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
