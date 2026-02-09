import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '@/services/api/clients.service';
import type { ClientFilters, CreateClientData, CreateVehicleData } from '@/types/client.types';

export const useClients = (filters?: ClientFilters, skip = 0, limit = 50) => {
    return useQuery({
        queryKey: ['clients', filters, skip, limit],
        queryFn: () => clientsService.getAll(filters, skip, limit)
    });
};

export const useClient = (id: number) => {
    return useQuery({
        queryKey: ['client', id],
        queryFn: () => clientsService.getById(id),
        enabled: !!id
    });
};

export const useClientStats = (id: number) => {
    return useQuery({
        queryKey: ['client-stats', id],
        queryFn: () => clientsService.getStats(id),
        enabled: !!id
    });
};

export const useClientVehicles = (clientId: number) => {
    return useQuery({
        queryKey: ['client-vehicles', clientId],
        queryFn: () => clientsService.getVehicles(clientId),
        enabled: !!clientId
    });
};

export const useClientServiceHistory = (clientId: number) => {
    return useQuery({
        queryKey: ['client-service-history', clientId],
        queryFn: () => clientsService.getServiceHistory(clientId),
        enabled: !!clientId
    });
};

export const useCreateClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateClientData) => clientsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
    });
};

export const useUpdateClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateClientData> }) =>
            clientsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
    });
};

export const useCreateVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateVehicleData) => clientsService.createVehicle(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['client-vehicles', variables.client_id] });
        }
    });
};

export const useDeleteVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => clientsService.deleteVehicle(id),
        onSuccess: () => {
            // We might need to invalidate specific client vehicles, but 'client-vehicles' usually needs clientId. 
            // For now invalidating all isn't ideal but simple. 
            // Better: Invalidate the specific query if we had access to clientId here. 
            // Or just invalidate all 'client-vehicles' queries.
            queryClient.invalidateQueries({ queryKey: ['client-vehicles'] });
        }
    });
};
