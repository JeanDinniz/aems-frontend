import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function WebSocketIndicator() {
    const { connection } = useWebSocket();
    const { connected, reconnecting } = connection;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-help">
                        <div
                            className={cn(
                                "w-2.5 h-2.5 rounded-full transition-colors",
                                connected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                                    reconnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
                            )}
                        />
                        {connected ? (
                            <Wifi className="w-4 h-4 text-slate-600" />
                        ) : (
                            <WifiOff className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-xs font-medium text-slate-600">
                            {connected ? 'Ao vivo' : reconnecting ? 'Reconectando...' : 'Offline'}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {connected
                            ? 'Conectado ao servidor de atualizações em tempo real'
                            : 'Desconectado. Tentando reconectar automaticamente...'}
                    </p>
                    {connection.lastConnected && (
                        <p className="text-xs text-slate-400 mt-1">
                            Última conexão: {connection.lastConnected.toLocaleTimeString()}
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
