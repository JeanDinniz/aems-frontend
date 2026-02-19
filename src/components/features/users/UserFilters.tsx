import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserFilters as Filters } from '@/types/user.types';
import { useQuery } from '@tanstack/react-query';
import { storesService } from '@/services/api/stores.service';

interface UserFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
    const { data: stores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
    });

    const handleChange = (key: keyof Filters, value: any) => {
        onFiltersChange({ ...filters, [key]: value !== 'all' ? value : undefined });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <Input
                placeholder="Buscar por nome ou e-mail"
                value={filters.search || ''}
                onChange={(e) => handleChange('search', e.target.value)}
                className="max-w-xs"
            />

            <Select
                value={filters.role || 'all'}
                onValueChange={(value) => handleChange('role', value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os cargos</SelectItem>
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
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
                            {store.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
