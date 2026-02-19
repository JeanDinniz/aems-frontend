import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { servicesService } from '../services/api/services.service';

// IDs dos serviços exclusivos de película (será preenchido quando cadastrados)
const FILM_ONLY_SERVICE_IDS: number[] = [];

export function useServices(department?: string) {
    const { data: allServices, isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: servicesService.getAll,
        staleTime: 1000 * 60 * 5,
    });

    const filtered = useMemo(() => {
        if (!allServices) return [];
        if (!department) return allServices;

        if (department === 'film') {
            // Mostrar apenas serviços exclusivos de película
            return allServices.filter((s) => FILM_ONLY_SERVICE_IDS.includes(s.id));
        }

        // Para todos os outros departamentos: mostrar todos os serviços EXCETO os exclusivos de película
        return allServices.filter((s) => !FILM_ONLY_SERVICE_IDS.includes(s.id));
    }, [allServices, department]);

    return { data: filtered, isLoading };
}
