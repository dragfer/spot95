import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = (event: CloseEvent) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPong: number = Date.now();
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

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
        
        // Handle pong messages
        if (data.type === 'pong') {
          this.lastPong = Date.now();
          return;
        }
        
        // Pass other messages to handlers
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
      console.log('WebSocket connection closed');
      this.closeHandlers.forEach(handler => handler(event));
      this.cleanup();
      this.isConnecting = false;
      
      // Attempt to reconnect if needed
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts), 30000); // Max 30s
        console.log(`Attempting to reconnect in ${delay}ms...`);
        setTimeout(() => this.connect(), delay);
      }
    };
  }

  private setupConnectionMonitoring() {
    // Clear any existing intervals
    this.cleanupConnectionMonitoring();
    
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    // Check connection status every 10 seconds
    this.connectionCheckInterval = setInterval(() => {
      const timeSinceLastPong = Date.now() - this.lastPong;
      if (timeSinceLastPong > 45000) { // 45 seconds without pong
        console.warn('No pong received, reconnecting...');
        this.reconnect();
      }
    }, 10000);
  }

  private cleanupConnectionMonitoring() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  public send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket is not connected');
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

  public close(permanent: boolean = false) {
    this.shouldReconnect = !permanent;
    if (this.ws) {
      this.ws.close();
    }
  }

  public getStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
      default:
        return 'closed';
    }
  }

  private cleanup() {
    this.cleanupConnectionMonitoring();
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      
      this.ws = null;
    }
  }
}

// Global WebSocket client instance
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (url: string): WebSocketClient => {
  if (!wsClient) {
    wsClient = new WebSocketClient(url);
  } else if (wsClient && wsClient['url'] !== url) {
    // If URL changed, close old connection and create new one
    wsClient.close(true);
    wsClient = new WebSocketClient(url);
  }
  return wsClient;
};

export const useWebSocket = (url: string, handlers: {
  onMessage?: MessageHandler;
  onError?: ErrorHandler;
  onClose?: CloseHandler;
} = {}) => {
  const clientRef = useRef<WebSocketClient | null>(null);
  const { onMessage, onError, onClose } = handlers;

  useEffect(() => {
    // Initialize WebSocket client
    clientRef.current = getWebSocketClient(url);
    
    // Set up handlers
    const cleanupFns: (() => void)[] = [];
    
    if (onMessage) {
      cleanupFns.push(clientRef.current.onMessage(onMessage));
    }
    
    if (onError) {
      cleanupFns.push(clientRef.current.onError(onError));
    }
    
    if (onClose) {
      cleanupFns.push(clientRef.current.onClose(onClose));
    }
    
    // Clean up on unmount
    return () => {
      cleanupFns.forEach(cleanup => cleanup());
      // Only close if this is the last component using the connection
      // and you want to close it when unmounting
      // clientRef.current?.close();
    };
  }, [url, onMessage, onError, onClose]);

  const send = useCallback((data: any) => {
    if (clientRef.current) {
      return clientRef.current.send(data);
    }
    return false;
  }, []);

  const reconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.reconnect();
    }
  }, []);

  const close = useCallback((permanent: boolean = false) => {
    if (clientRef.current) {
      clientRef.current.close(permanent);
    }
  }, []);

  const getStatus = useCallback(() => {
    return clientRef.current?.getStatus() || 'closed';
  }, []);

  return {
    send,
    reconnect,
    close,
    getStatus,
  };
};

export default useWebSocket;
