import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { storesService } from '@/services/api/stores.service';
import { CATEGORY_LABELS } from '@/types/purchase-requests.types';
import type { PendingApprovalFilters } from '@/types/purchase-requests.types';

interface ApprovalFiltersProps {
    filters: PendingApprovalFilters;
    onFiltersChange: (filters: PendingApprovalFilters) => void;
}

export function ApprovalFilters({ filters, onFiltersChange }: ApprovalFiltersProps) {
    const { data: stores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
    });

    const handleChange = (key: keyof PendingApprovalFilters, value: any) => {
        onFiltersChange({ ...filters, [key]: value !== 'all' ? value : undefined });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            {/* Loja */}
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

            {/* Urgência */}
            <Select
                value={filters.urgency || 'all'}
                onValueChange={(value) => handleChange('urgency', value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Urgência" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as urgências</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
            </Select>

            {/* Categoria */}
            <Select
                value={filters.category || 'all'}
                onValueChange={(value) => handleChange('category', value)}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Data Início */}
            <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="w-auto"
            />

            {/* Data Fim */}
            <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="w-auto"
            />
        </div>
    );
}
