import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { WebSocketEvent, WebSocketConnection } from '@/types/websocket.types';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { webSocketService } from '@/services/websocket/websocket.service';

export function useWebSocket(storeId?: number) {
    const [connection, setConnection] = useState<WebSocketConnection>({
        connected: false,
        reconnecting: false,
        lastConnected: null,
        retryCount: 0
    });

    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();

    const handleEvent = useCallback((event: WebSocketEvent) => {
        switch (event.event) {
            case 'service_order_created':
            case 'service_order_updated':
            case 'service_order_status_changed':
                queryClient.invalidateQueries({ queryKey: ['service-orders'] });

                if (event.event === 'service_order_created') {
                    toast({
                        title: 'Nova Ordem de Serviço',
                        description: `OS ${event.data.order_number} foi criada.`
                    });
                }
                break;

            case 'semaphore_updated':
                queryClient.invalidateQueries({ queryKey: ['service-orders'] });
                break;

        }
    }, [queryClient, toast, user]);

    useEffect(() => {
        if (!user) return;

        // Subscribe to connection changes
        const unsubscribeConnection = webSocketService.subscribeConnection(setConnection);

        // Subscribe to events
        const unsubscribeEvents = webSocketService.subscribe(handleEvent);

        // Connect if not already connected
        const { tokens } = useAuthStore.getState();
        if (tokens?.accessToken) {
            webSocketService.connect(tokens.accessToken, storeId);
        }

        return () => {
            unsubscribeConnection();
            unsubscribeEvents();
            // We generally don't disconnect on unmount of the hook IF we want the connection 
            // to persist across page navigations, but if storeId changes, we might want to reconnect.
            // For now, let's keep it persistent and only disconnect explicitly if needed.
            // But if functionality requires distinct connections per store view, this logic might need adjustment.
            // Given the singleton, we rely on the service to handle "already connected" states.
        };
    }, [user, storeId, handleEvent]);

    const send = useCallback((data: Record<string, unknown>) => {
        webSocketService.send(data);
    }, []);

    const reconnect = useCallback(() => {
        const { tokens } = useAuthStore.getState();
        if (tokens?.accessToken) {
            webSocketService.disconnect();
            webSocketService.connect(tokens.accessToken, storeId);
        }
    }, [storeId]);

    const disconnect = useCallback(() => {
        webSocketService.disconnect();
    }, []);

    return {
        connection,
        send,
        reconnect,
        disconnect
    };
}
