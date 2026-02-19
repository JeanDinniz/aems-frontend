import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { storesService } from '@/services/api/stores.service';
import { useStoreStore } from '@/stores/store.store';
import { useAuth } from '@/hooks/useAuth';

export function useStores() {
    const { user } = useAuth();
    const { availableStores, selectedStoreId, isMultiStore, selectStore, setAvailableStores } = useStoreStore();

    const { data: allStores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: () => storesService.list(),
        enabled: !!user,
        staleTime: 1000 * 60 * 60, // 1 hour - stores don't change often
    });

    // Filter available stores based on user role
    useEffect(() => {
        if (!user || allStores.length === 0) return;

        if (user.role === 'owner') {
            setAvailableStores(allStores);
        } else if (user.role === 'supervisor') {
            const supervised = allStores.filter(s => user.supervised_store_ids?.includes(s.id));
            setAvailableStores(supervised);
        } else {
            // operator - only their store
            const myStore = allStores.filter(s => s.id === user.store_id);
            setAvailableStores(myStore);
        }
    }, [user, allStores, setAvailableStores]);

    return {
        stores: availableStores,
        selectedStoreId,
        isMultiStore,
        selectStore,
        allStores // exposed just in case needed for raw list
    };
}
