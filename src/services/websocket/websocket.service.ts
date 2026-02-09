import type { WebSocketEvent, WebSocketConnection } from '@/types/websocket.types';

type EventHandler = (event: WebSocketEvent) => void;
type ConnectionHandler = (connection: WebSocketConnection) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    private pingInterval: ReturnType<typeof setTimeout> | undefined;
    private eventHandlers: EventHandler[] = [];
    private connectionHandlers: ConnectionHandler[] = [];

    private connectionState: WebSocketConnection = {
        connected: false,
        reconnecting: false,
        lastConnected: null,
        retryCount: 0
    };

    private static instance: WebSocketService;
    private readonly WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    private readonly RECONNECT_DELAY = 3000;
    private readonly MAX_RETRIES = 5;

    private constructor() { }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public connect(token: string, storeId?: number): void {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        try {
            const url = storeId
                ? `${this.WS_URL}/${storeId}?token=${token}`
                : `${this.WS_URL}/all?token=${token}`;

            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                this.updateConnectionState({
                    connected: true,
                    reconnecting: false,
                    lastConnected: new Date(),
                    retryCount: 0
                });
                // console.log('WebSocket connected');
                this.startPing();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketEvent = JSON.parse(event.data);
                    this.notifyEventHandlers(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                this.stopPing();
                this.updateConnectionState({ connected: false });
                // console.log('WebSocket disconnected');
                this.handleReconnection(token, storeId);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.handleReconnection(token, storeId);
        }
    }

    public disconnect(): void {
        this.stopPing();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.updateConnectionState({
            connected: false,
            reconnecting: false,
            lastConnected: null,
            retryCount: 0
        });
    }

    public subscribe(handler: EventHandler): () => void {
        this.eventHandlers.push(handler);
        return () => {
            this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
        };
    }

    public subscribeConnection(handler: ConnectionHandler): () => void {
        this.connectionHandlers.push(handler);
        // Immediately notify current state
        handler(this.connectionState);
        return () => {
            this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
        };
    }

    public send(data: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    private updateConnectionState(updates: Partial<WebSocketConnection>): void {
        this.connectionState = { ...this.connectionState, ...updates };
        this.connectionHandlers.forEach(handler => handler(this.connectionState));
    }

    private notifyEventHandlers(event: WebSocketEvent): void {
        this.eventHandlers.forEach(handler => handler(event));
    }

    private handleReconnection(token: string, storeId?: number): void {
        if (this.connectionState.retryCount < this.MAX_RETRIES) {
            this.updateConnectionState({
                reconnecting: true,
                retryCount: this.connectionState.retryCount + 1
            });

            this.reconnectTimeout = setTimeout(() => {
                this.connect(token, storeId);
            }, this.RECONNECT_DELAY);
        }
    }

    private startPing(): void {
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
    }
}

export const webSocketService = WebSocketService.getInstance();
