import { create } from 'zustand';
import type { Store } from '@/services/api/stores.service';

interface StoreState {
    availableStores: Store[];
    selectedStoreId: number | null;
    isMultiStore: boolean;
    setAvailableStores: (stores: Store[]) => void;
    selectStore: (storeId: number | null) => void;  // null = "Todas as Lojas"
}

export const useStoreStore = create<StoreState>()((set) => ({
    availableStores: [],
    selectedStoreId: null,
    isMultiStore: false,

    setAvailableStores: (stores) =>
        set({
            availableStores: stores,
            isMultiStore: stores.length > 1,
            // If only 1 store, auto-select it. If more, keep current selection or default to null ("All") if appropriate, 
            // but usually we want to force selection or default to "All" for owners. 
            // The prompt logic: selectedStoreId: stores.length === 1 ? stores[0].id : null
            selectedStoreId: stores.length === 1 ? stores[0].id : null,
        }),

    selectStore: (storeId) => set({ selectedStoreId: storeId }),
}));
