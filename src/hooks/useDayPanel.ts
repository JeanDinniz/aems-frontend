import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInMinutes } from 'date-fns';
import type { ServiceOrderCard, Department, SemaphoreColor, ServiceOrderStatus } from '@/types/day-panel.types';
import { useWebSocket } from './useWebSocket';
import { serviceOrdersService } from '@/services/api/service-orders.service';
import { useAuthStore } from '@/stores/auth.store';

// Helper to calculate semaphore color
export const calculateSemaphoreColor = (entryTime: string, department: Department): SemaphoreColor => {
    const minutes = differenceInMinutes(new Date(), new Date(entryTime));

    if (department === 'film' || department === 'vn' || department === 'vu') {
        if (minutes < 45) return 'white';
        if (minutes < 90) return 'yellow';
        if (minutes < 180) return 'orange';
        return 'red';
    }

    if (department === 'bodywork' || department === 'workshop') {
        if (minutes < 60) return 'white';
        if (minutes < 120) return 'yellow';
        if (minutes < 240) return 'orange';
        return 'red';
    }

    // ppf — mesmo threshold que film
    if (department === 'ppf') {
        if (minutes < 45) return 'white';
        if (minutes < 90) return 'yellow';
        if (minutes < 180) return 'orange';
        return 'red';
    }

    return 'white';
};

interface UseDayPanelOptions {
    // Permite forçar uma loja específica (ex: Supervisor/Owner escolhe via select)
    storeId?: number;
}

export function useDayPanel({ storeId: propStoreId }: UseDayPanelOptions = {}) {
    const { user } = useAuthStore();
    const { connection } = useWebSocket(propStoreId ?? user?.store_id ?? undefined);
    const [now, setNow] = useState(new Date());

    // Local state for filters
    const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>('all');
    const [onlyDelayed, setOnlyDelayed] = useState(false);

    // Interval to update "now" every second for live timers
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Determinar o store_id a enviar para o backend:
    // - Operator: não envia (backend usa JWT)
    // - Supervisor/Owner: envia propStoreId se fornecido, senão o store_id do próprio usuário
    const resolvedStoreId = useMemo(() => {
        if (user?.role === 'operator') return undefined;
        return propStoreId ?? user?.store_id ?? undefined;
    }, [user, propStoreId]);

    // Fetch initial data
    const { data: orders = [], isLoading, error } = useQuery({
        queryKey: ['day-panel-orders', resolvedStoreId],
        queryFn: async () => {
            const response = await serviceOrdersService.getDayPanel(resolvedStoreId);
            return response;
        },
        // Só habilita a query quando tivermos certeza do storeId necessário:
        // - Operator: sempre ok (backend resolve via JWT)
        // - Supervisor/Owner: só dispara se resolvedStoreId for definido
        enabled: user?.role === 'operator' || resolvedStoreId !== undefined,
        staleTime: 0,
        refetchInterval: 10_000, // Refetch a cada 10s como backup do WebSocket
    });

    // Derived state with semaphore colors recalculated based on "now"
    const processedOrders = useMemo(() => {
        return orders.map(order => ({
            ...order,
            semaphoreColor: calculateSemaphoreColor(order.entryTime, order.department),
            elapsedMinutes: differenceInMinutes(now, new Date(order.entryTime)),
        }));
    }, [orders, now]);

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return processedOrders.filter(order => {
            // 1. Department Filter
            if (departmentFilter !== 'all' && order.department !== departmentFilter) {
                return false;
            }

            // 2. Delayed Filter (Orange or Red) — não aplica a entregues
            if (onlyDelayed && order.status !== 'delivered') {
                return order.semaphoreColor === 'orange' || order.semaphoreColor === 'red';
            }

            return true;
        });
    }, [processedOrders, departmentFilter, onlyDelayed]);

    // Group by status for Kanban board
    const columns = useMemo(() => {
        const cols: Record<ServiceOrderStatus, ServiceOrderCard[]> = {
            waiting:     [],
            in_progress: [],
            inspection:  [],
            ready:       [],
            delivered:   [],
        };

        filteredOrders.forEach(order => {
            const key = order.status as ServiceOrderStatus;
            if (key in cols) {
                cols[key].push(order);
            }
        });

        return cols;
    }, [filteredOrders]);

    // Statistics (excluindo entregues dos contadores de semáforo)
    const stats = useMemo(() => {
        const activeOrders = processedOrders.filter(o => o.status !== 'delivered');
        const total = orders.length;
        const delayed = activeOrders.filter(o => o.semaphoreColor === 'orange' || o.semaphoreColor === 'red').length;
        const critical = activeOrders.filter(o => o.semaphoreColor === 'red').length;
        return { total, delayed, critical };
    }, [orders, processedOrders]);

    return {
        orders: filteredOrders,
        columns,
        stats,
        isLoading,
        error,
        resolvedStoreId,
        filters: {
            department: departmentFilter,
            setDepartment: setDepartmentFilter,
            onlyDelayed,
            setOnlyDelayed,
        },
        connection,
    };
}
