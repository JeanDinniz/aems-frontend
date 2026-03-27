import { createContext, useContext, type ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { WebSocketConnection } from '@/types/websocket.types';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketContextType {
    connection: WebSocketConnection;
    send: (data: Record<string, unknown>) => void;
    reconnect: () => void;
    disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // If user has specific store, connect to it
    // If owner, connect to "all" (or handle logic inside hook)
    const storeId = (user?.role !== 'owner') && user?.store_id
        ? user.store_id
        : undefined;

    const ws = useWebSocket(storeId);

    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within WebSocketProvider');
    }
    return context;
}
