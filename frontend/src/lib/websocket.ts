// ✅ websocket.ts (Fully Fixed Again with Deep Validation)

import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = (event: CloseEvent) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private isConnecting = false;
  private shouldReconnect = true;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPong = Date.now();
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(url: string) {
    if (!url || !url.startsWith('ws')) throw new Error('Invalid WebSocket URL');
    this.url = url;
    this.connect();
  }

  private connect() {
    if (!this.url || !this.url.startsWith('ws')) {
      console.error('[WebSocketClient] Cannot connect: Invalid URL', this.url);
      return;
    }

    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.isConnecting = true;
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.setupConnectionMonitoring();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            this.lastPong = Date.now();
            return;
          }
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.errorHandlers.forEach(handler => handler(error));
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed');
        this.closeHandlers.forEach(handler => handler(event));
        this.cleanup();
        this.isConnecting = false;

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms...`);
          setTimeout(() => this.connect(), delay);
        }
      };
    } catch (err) {
      console.error('[WebSocketClient] Failed to create WebSocket:', err);
    }
  }

  private setupConnectionMonitoring() {
    this.cleanupConnectionMonitoring();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    this.connectionCheckInterval = setInterval(() => {
      if (Date.now() - this.lastPong > 45000) {
        console.warn('No pong received, reconnecting...');
        this.reconnect();
      }
    }, 10000);
  }

  private cleanupConnectionMonitoring() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.connectionCheckInterval) clearInterval(this.connectionCheckInterval);
    this.pingInterval = null;
    this.connectionCheckInterval = null;
  }

  public send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket not connected');
    return false;
  }

  public onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onError(handler: ErrorHandler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  public onClose(handler: CloseHandler) {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  public reconnect() {
    this.cleanup();
    this.connect();
  }

  public close(permanent = false) {
    this.shouldReconnect = !permanent;
    if (this.ws) this.ws.close();
  }

  public getStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    return ['connecting', 'open', 'closing', 'closed'][this.ws.readyState] as any;
  }

  private cleanup() {
    this.cleanupConnectionMonitoring();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN) this.ws.close();
      this.ws = null;
    }
  }
}

let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (url: string): WebSocketClient => {
  if (!url || typeof url !== 'string' || !url.startsWith('ws')) {
    console.warn('Invalid WebSocket URL:', url);
    throw new Error('Invalid WebSocket URL');
  }

  if (!wsClient) {
    wsClient = new WebSocketClient(url);
  } else if (wsClient['url'] !== url) {
    wsClient.close(true);
    wsClient = new WebSocketClient(url);
  }
  return wsClient;
};

export const useWebSocket = (
  url: string,
  handlers: {
    onMessage?: MessageHandler;
    onError?: ErrorHandler;
    onClose?: CloseHandler;
  } = {}
) => {
  const clientRef = useRef<WebSocketClient | null>(null);
  const { onMessage, onError, onClose } = handlers;

  useEffect(() => {
    if (!url || !url.startsWith('ws')) {
      console.warn('[useWebSocket] Skipping setup due to invalid URL:', url);
      return;
    }

    clientRef.current = getWebSocketClient(url);
    const cleanups: (() => void)[] = [];

    if (onMessage) cleanups.push(clientRef.current.onMessage(onMessage));
    if (onError) cleanups.push(clientRef.current.onError(onError));
    if (onClose) cleanups.push(clientRef.current.onClose(onClose));

    return () => cleanups.forEach(fn => fn());
  }, [url, onMessage, onError, onClose]);

  const send = useCallback((data: any) => clientRef.current?.send(data) || false, []);
  const reconnect = useCallback(() => clientRef.current?.reconnect(), []);
  const close = useCallback((permanent = false) => clientRef.current?.close(permanent), []);
  const getStatus = useCallback(() => clientRef.current?.getStatus() || 'closed', []);

  return { send, reconnect, close, getStatus };
};

export default useWebSocket;
