import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrdersService } from '@/services/api/service-orders.service';
import type { ServiceOrderFilters, CreateServiceOrderData } from '@/types/service-order.types';

export const useServiceOrders = (filters?: ServiceOrderFilters, skip = 0, limit = 20) => {
    return useQuery({
        queryKey: ['service-orders', filters, skip, limit],
        queryFn: () => serviceOrdersService.getAll(filters, skip, limit)
    });
};

export const useServiceOrder = (id?: number) => {
    return useQuery({
        queryKey: ['service-order', id],
        queryFn: () => serviceOrdersService.getById(id!),
        enabled: !!id
    });
};

export const useCreateServiceOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateServiceOrderData) => serviceOrdersService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-orders'] });
            queryClient.invalidateQueries({ queryKey: ['day-panel-orders'] });
        }
    });
};

export const useUpdateServiceOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateServiceOrderData> }) =>
            serviceOrdersService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-orders'] });
            queryClient.invalidateQueries({ queryKey: ['service-order'] });
            queryClient.invalidateQueries({ queryKey: ['day-panel-orders'] });
        }
    });
};

export const useCancelServiceOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
            serviceOrdersService.cancel(id, reason),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['service-orders'] });
            queryClient.invalidateQueries({ queryKey: ['service-order', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['day-panel-orders'] });
        },
    });
};

export const useUpdateServiceOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, extras }: { id: number; status: string; extras?: Record<string, unknown> }) =>
            serviceOrdersService.updateStatus(id, status, extras),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['service-orders'] });
            queryClient.invalidateQueries({ queryKey: ['service-order', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['day-panel-orders'] });
        }
    });
};
