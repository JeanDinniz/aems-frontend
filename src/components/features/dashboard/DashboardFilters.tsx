import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { storesService } from '@/services/api/stores.service';
import { useAuthStore } from '@/stores/auth.store';
import type { DashboardFilters as Filters } from '@/types/dashboard.types';

interface DashboardFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
    const { user } = useAuthStore();
    const { data: stores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
        enabled: !!user && ['owner', 'supervisor'].includes(user.role),
    });

    const handleChange = (key: keyof Filters, value: any) => {
        onFiltersChange({ ...filters, [key]: value !== 'all' ? value : undefined });
    };

    const showStoreFilter = user?.role === 'owner' || user?.role === 'supervisor';

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex gap-2 bg-muted p-1 rounded-lg">
                <Button
                    variant={filters.period === 'today' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleChange('period', 'today')}
                >
                    Hoje
                </Button>
                <Button
                    variant={filters.period === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleChange('period', 'week')}
                >
                    Semana
                </Button>
                <Button
                    variant={filters.period === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleChange('period', 'month')}
                >
                    Mês
                </Button>
                <Button
                    variant={filters.period === 'year' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleChange('period', 'year')}
                >
                    Ano
                </Button>
            </div>

            {showStoreFilter && (
                <Select
                    value={filters.storeId?.toString() || 'all'}
                    onValueChange={(value) => handleChange('storeId', value === 'all' ? undefined : Number(value))}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Todas as lojas" />
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
            )}

            {/* Filtro de Departamento */}
            <Select
                value={filters.department || 'all'}
                onValueChange={(value) => handleChange('department', value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos departamentos</SelectItem>
                    <SelectItem value="film">Película</SelectItem>
                    <SelectItem value="ppf">PPF</SelectItem>
                    <SelectItem value="vn">VN</SelectItem>
                    <SelectItem value="vu">VU</SelectItem>
                    <SelectItem value="bodywork">Funilaria</SelectItem>
                    <SelectItem value="workshop">Oficina</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
