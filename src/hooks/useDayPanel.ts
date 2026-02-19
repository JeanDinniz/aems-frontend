import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInMinutes } from 'date-fns';
import type { ServiceOrderCard, Department, SemaphoreColor, ServiceOrderStatus } from '@/types/day-panel.types';
import { useWebSocket } from './useWebSocket';
import { serviceOrdersService } from '@/services/api/service-orders.service';

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

    return 'white';
};

interface UseDayPanelOptions {
    storeId?: number;
}

export function useDayPanel({ storeId }: UseDayPanelOptions = {}) {
    // const { user } = useAuth();
    // const queryClient = useQueryClient();
    const { connection } = useWebSocket(storeId);
    const [now, setNow] = useState(new Date());

    // Local state for filters
    const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>('all');
    const [onlyDelayed, setOnlyDelayed] = useState(false);

    // Interval to update "now" every second for live timers
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch initial data
    const { data: orders = [], isLoading, error } = useQuery({
        queryKey: ['day-panel-orders', storeId],
        queryFn: async () => {
            const response = await serviceOrdersService.getDayPanel(storeId);
            return response;
        },
        enabled: !!storeId,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 30000,  // Refetch a cada 30s como backup do WebSocket
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

            // 2. Delayed Filter (Orange or Red)
            if (onlyDelayed) {
                return order.semaphoreColor === 'orange' || order.semaphoreColor === 'red';
            }

            return true;
        });
    }, [processedOrders, departmentFilter, onlyDelayed]);

    // Group by status for Kanban
    const columns = useMemo(() => {
        const cols: Record<ServiceOrderStatus, ServiceOrderCard[]> = {
            waiting: [],
            in_progress: [],
            inspection: [],
            ready: [],
            delivered: [],
        };

        filteredOrders.forEach(order => {
            if (cols[order.status]) {
                cols[order.status].push(order);
            }
        });

        return cols;
    }, [filteredOrders]);

    // Statistics
    const stats = useMemo(() => {
        const total = orders.length;
        const delayed = processedOrders.filter(o => o.semaphoreColor === 'orange' || o.semaphoreColor === 'red').length;
        const critical = processedOrders.filter(o => o.semaphoreColor === 'red').length;
        return { total, delayed, critical };
    }, [orders, processedOrders]);

    return {
        orders: filteredOrders,
        columns,
        stats,
        isLoading,
        error,
        filters: {
            department: departmentFilter,
            setDepartment: setDepartmentFilter,
            onlyDelayed,
            setOnlyDelayed,
        },
        connection,
    };
}
