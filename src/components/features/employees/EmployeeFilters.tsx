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
                className="max-w-xs bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white placeholder:text-[#999999] dark:placeholder:text-zinc-500 focus-visible:ring-[#F5A800]"
            />

            <Select
                value={filters.store_id?.toString() || 'all'}
                onValueChange={(v) => handleChange('store_id', v === 'all' ? undefined : Number(v))}
            >
                <SelectTrigger className="w-[200px] bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                    <SelectValue placeholder="Loja" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <SelectItem value="all" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Todas as lojas</SelectItem>
                    {stores?.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()} className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">
                            {store.code} - {store.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.department || 'all'}
                onValueChange={(v) => handleChange('department', v === 'all' ? undefined : v)}
            >
                <SelectTrigger className="w-[200px] bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                    <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <SelectItem value="all" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Todos os cargos</SelectItem>
                    <SelectItem value="film" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Instaladores de Película</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={filters.is_active === undefined ? 'all' : filters.is_active ? 'true' : 'false'}
                onValueChange={(v) => handleChange('is_active', v === 'all' ? undefined : v === 'true')}
            >
                <SelectTrigger className="w-[160px] bg-white dark:bg-[#1A1A1A] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white focus:ring-[#F5A800]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#252525] border-[#D1D1D1] dark:border-[#333333] text-[#111111] dark:text-white">
                    <SelectItem value="all" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Todos</SelectItem>
                    <SelectItem value="true" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Ativos</SelectItem>
                    <SelectItem value="false" className="focus:bg-gray-100 dark:focus:bg-zinc-700 focus:text-[#111111] dark:focus:text-white">Inativos</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
