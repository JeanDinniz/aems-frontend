import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filmBobbinsService } from '@/services/api/film-bobbins.service';
import type { FilmBobbinFilters, CreateFilmBobbinData, FilmConsumption } from '@/types/inventory.types';

export const useFilmBobbins = (filters?: FilmBobbinFilters, skip = 0, limit = 50) => {
    return useQuery({
        queryKey: ['film-bobbins', filters, skip, limit],
        queryFn: () => filmBobbinsService.getAll(filters, skip, limit)
    });
};

export const useFilmBobbin = (id: number) => {
    return useQuery({
        queryKey: ['film-bobbin', id],
        queryFn: () => filmBobbinsService.getById(id),
        enabled: !!id
    });
};

export const useCreateFilmBobbin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateFilmBobbinData) => filmBobbinsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['film-bobbins'] });
        }
    });
};

export const useRegisterConsumption = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, consumption }: { id: number; consumption: FilmConsumption }) =>
            filmBobbinsService.registerConsumption(id, consumption),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['film-bobbins'] });
            queryClient.invalidateQueries({ queryKey: ['film-bobbin'] });
        }
    });
};

export const useUpdateFilmBobbin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateFilmBobbinData> }) =>
            filmBobbinsService.update(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['film-bobbins'] });
            queryClient.invalidateQueries({ queryKey: ['film-bobbin', variables.id] });
        }
    });
};

export const useBobbinAlerts = (storeId?: number) => {
    return useQuery({
        queryKey: ['bobbin-alerts', storeId],
        queryFn: () => filmBobbinsService.getAlerts(storeId),
        refetchInterval: 1000 * 60 * 5 // 5 minutes
    });
};

export const useYieldStats = (bobbinId: number) => {
    return useQuery({
        queryKey: ['yield-stats', bobbinId],
        queryFn: () => filmBobbinsService.getYieldStats(bobbinId),
        enabled: !!bobbinId
    });
};
