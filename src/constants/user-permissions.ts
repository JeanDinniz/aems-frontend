export interface ModuleDefinition {
    key: string;
    label: string;
}

export interface ModuleGroup {
    key: string;
    label: string;
    modules: ModuleDefinition[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
    {
        key: 'admin',
        label: 'ADMINISTRAÇÃO',
        modules: [
            { key: 'users',          label: 'Usuários' },
            { key: 'employees',      label: 'Funcionários' },
            { key: 'consultants',    label: 'Consultores' },
            { key: 'stores',         label: 'Lojas' },
            { key: 'services',       label: 'Serviços' },
            { key: 'vehicle_models', label: 'Modelos de Veículos' },
        ],
    },
    {
        key: 'operational',
        label: 'OPERACIONAL',
        modules: [
            { key: 'service_orders', label: 'Ordens de Serviço' },
            { key: 'conference',     label: 'Conferência' },
            { key: 'fechamento',     label: 'Fechamento' },
        ],
    },
];

/**
 * Mapeia module key → href da sidebar.
 * Usado para filtrar itens visíveis com base em can_view.
 */
export const MODULE_ROUTE_MAP: Record<string, string> = {
    users:          '/admin/users',
    employees:      '/admin/employees',
    consultants:    '/admin/consultants',
    stores:         '/admin/stores',
    services:       '/servicos',
    vehicle_models: '/admin/modelos',
    service_orders: '/service-orders',
    conference:     '/conference',
    fechamento:     '/fechamento',
};
