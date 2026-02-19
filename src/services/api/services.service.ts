import { apiClient } from './client';

export interface ServiceItem {
    id: number;
    name: string;
    description: string | null;
    department: string;
    base_price: number;
    is_active: boolean;
    available_for_all_departments: boolean;
}

const SERVICE_ORDER: string[] = [
    'Lavagem Cortesia',
    'Lavagem + Aspiração',
    'Lavagem + Aspiração + Motor',
    'Enceramento',
    'Polimento',
    'Higienização Interna',
    'Impermeabilização Do Estofado',
    'Hidratação',
    'Vitrificação - Pintura',
    'Vitrificação - Banco de Couro',
    'VIP-CAR',
];

export const servicesService = {
    getAll: async (): Promise<ServiceItem[]> => {
        const response = await apiClient.get('/services', {
            params: { limit: 100 },
        });
        const items: ServiceItem[] = response.data.items;
        return items.sort((a, b) => {
            const indexA = SERVICE_ORDER.indexOf(a.name);
            const indexB = SERVICE_ORDER.indexOf(b.name);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
    },
};
