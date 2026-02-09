import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

export function ConnectionIndicator() {
    const { connection, reconnect } = useWebSocketContext();

    if (connection.connected) {
        return (
            <div className="flex items-center gap-2 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Online</span>
            </div>
        );
    }

    if (connection.reconnecting) {
        return (
            <div className="flex items-center gap-2 text-yellow-600">
                <WifiOff className="h-4 w-4 animate-pulse" />
                <span className="text-xs hidden sm:inline">Reconectando...</span>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-2 text-red-600 cursor-pointer"
            onClick={reconnect}
            title="Clique para reconectar"
        >
            <WifiOff className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">Offline</span>
        </div>
    );
}
