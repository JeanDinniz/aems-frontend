import { useQuery } from '@tanstack/react-query'
import { vehicleModelsService } from '@/services/api/vehicle-models.service'

export function useVehicleModels(params: { store_id?: number; active_only?: boolean } = {}) {
    return useQuery({
        queryKey: ['vehicle-models', params.store_id, params.active_only],
        queryFn: () => vehicleModelsService.list(params),
        enabled: !!params.store_id,
        staleTime: 1000 * 60 * 5,
    })
}
