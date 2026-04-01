import { useQuery } from '@tanstack/react-query';
import { servicesService } from '../services/api/services.service';
import type { ServiceItem } from '../services/api/services.service';

export function useServices(department?: string, brandId?: number) {
    return useQuery<ServiceItem[]>({
        queryKey: ['services', department, brandId],
        queryFn: async () => {
            const result = await servicesService.list({
                department,
                brand_id: brandId,
                is_active: true,
                limit: 300,
            });
            const seen = new Set<string>();
            return result.items.filter((s) => {
                if (seen.has(s.name)) return false;
                seen.add(s.name);
                return true;
            });
        },
        staleTime: 1000 * 60 * 5,
    });
}
