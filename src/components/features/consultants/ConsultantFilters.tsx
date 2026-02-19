import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ConsultantFilters as Filters } from '@/types/consultant.types';
import { useDealerships } from '@/hooks/useDealerships';
import { useStores } from '@/hooks/useStores';

interface ConsultantFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

export function ConsultantFilters({ filters, onFiltersChange }: ConsultantFiltersProps) {
    const { stores } = useStores();
    const { dealerships } = useDealerships({
        is_active: true,
        store_id: filters.store_id
    });

    const handleChange = (key: keyof Filters, value: any) => {
        onFiltersChange({ ...filters, [key]: value !== 'all' ? value : undefined });
    };

    const handleStoreChange = (value: string) => {
        const storeId = value === 'all' ? undefined : Number(value);
        onFiltersChange({ ...filters, store_id: storeId, dealership_id: undefined });
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
                onValueChange={handleStoreChange}
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
                value={filters.dealership_id?.toString() || 'all'}
                onValueChange={(value) => handleChange('dealership_id', value === 'all' ? undefined : Number(value))}
                disabled={!filters.store_id && dealerships.length === 0}
            >
                <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder={
                        !filters.store_id && dealerships.length === 0
                            ? "Selecione uma loja primeiro"
                            : "Concessionária"
                    } />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as concessionárias</SelectItem>
                    {dealerships?.map((dealership) => (
                        <SelectItem key={dealership.id} value={dealership.id.toString()}>
                            {dealership.name} ({dealership.brand})
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
