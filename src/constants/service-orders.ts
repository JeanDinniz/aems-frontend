import type { Department, ServiceOrderStatus } from '@/types/service-order.types';

export const DEPARTMENTS: { value: Department; label: string }[] = [
    { value: 'film',     label: 'Película' },
    { value: 'ppf',      label: 'PPF' },
    { value: 'vn',       label: 'VN (Veículos Novos)' },
    { value: 'vd',       label: 'Venda Direta' },
    { value: 'vu',       label: 'VU (Veículos Usados)' },
    { value: 'bodywork', label: 'Funilaria' },
    { value: 'workshop', label: 'Oficina' },
];

export const DEPARTMENTS_MAP: Record<Department, string> = {
    film:     'Película',
    ppf:      'PPF',
    vn:       'VN',
    vd:       'Venda Direta',
    vu:       'VU',
    bodywork: 'Funilaria',
    workshop: 'Oficina',
};

export const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
    waiting:    'Aguardando',
    doing:      'Fazendo',
    inspection: 'Inspeção',
    ready:      'Pronto',
    delivered:  'Entregue',
    cancelled:  'Cancelada',
};
