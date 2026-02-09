import { useState, useEffect, useCallback } from 'react';
import { incidentsService } from '@/services/incidents.service';
import type { IncidentUpdate } from '@/types/incident.types';
import { useToast } from '@/hooks/use-toast';

export function useIncidentUpdates(incidentId: string) {
    const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Carrega updates
    const loadUpdates = useCallback(async () => {
        try {
            setLoading(true);
            const data = await incidentsService.getUpdates(incidentId);
            setUpdates(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: 'Erro ao carregar histórico'
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [incidentId]);

    // Adiciona comentário
    const addComment = async (content: string, files?: File[]) => {
        try {
            setSubmitting(true);

            const newUpdate = files && files.length > 0
                ? await incidentsService.addCommentWithAttachments(incidentId, content, files)
                : await incidentsService.addComment(incidentId, content);

            setUpdates(prev => [...prev, newUpdate]);
            toast({
                title: 'Comentário adicionado'
            });
            return newUpdate;
        } catch (error) {
            toast({
                variant: "destructive",
                title: 'Erro ao adicionar comentário'
            });
            console.error(error);
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    // Deleta comentário
    const deleteComment = async (updateId: string) => {
        try {
            await incidentsService.deleteUpdate(incidentId, updateId);
            setUpdates(prev => prev.filter(u => u.id !== updateId));
            toast({
                title: 'Comentário removido'
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: 'Erro ao remover comentário'
            });
            console.error(error);
        }
    };

    // Edita comentário
    const editComment = async (updateId: string, content: string) => {
        try {
            const updatedItem = await incidentsService.editUpdate(incidentId, updateId, content);
            setUpdates(prev => prev.map(u => u.id === updateId ? updatedItem : u));
            toast({
                title: 'Comentário atualizado'
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: 'Erro ao atualizar comentário'
            });
            console.error(error);
        }
    };

    // Carrega na montagem
    useEffect(() => {
        loadUpdates();
    }, [loadUpdates]);

    return {
        updates,
        loading,
        submitting,
        addComment,
        deleteComment,
        editComment,
        refresh: loadUpdates
    };
}
