import { useEffect, useRef, useCallback, useState } from 'react';

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
  private statusChangeHandlers: Set<(status: 'connecting' | 'open' | 'closing' | 'closed') => void> = new Set();
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;
  private pingInterval: ReturnType<typeof setTimeout> | null = null;
  private lastPong: number = Date.now();
  private connectionCheckInterval: ReturnType<typeof setTimeout> | null = null;
  private _status: 'connecting' | 'open' | 'closing' | 'closed' = 'closed';

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private setStatus(status: 'connecting' | 'open' | 'closing' | 'closed') {
    if (this._status !== status) {
      this._status = status;
      console.log(`WebSocket status changed to: ${status}`);
      this.statusChangeHandlers.forEach(handler => handler(status));
    }
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.setStatus('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.setStatus('open');
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
      this.setStatus('closing');
      this.ws.close();
      this.cleanup();
    }
    this.setStatus('closed');
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

  public getStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    const status = (() => {
      switch (this.ws.readyState) {
        case WebSocket.CONNECTING: return 'connecting';
        case WebSocket.OPEN: return 'open';
        case WebSocket.CLOSING: return 'closing';
        case WebSocket.CLOSED: return 'closed';
        default: return 'closed';
      }
    })();
    
    // Update internal status if it's different
    if (this._status !== status) {
      this._status = status;
      this.statusChangeHandlers.forEach(handler => handler(status));
    }
    
    return status;
  }
  
  public onStatusChange(handler: (status: 'connecting' | 'open' | 'closing' | 'closed') => void): () => void {
    this.statusChangeHandlers.add(handler);
    // Call handler immediately with current status
    handler(this.getStatus());
    
    // Return cleanup function
    return () => {
      this.statusChangeHandlers.delete(handler);
    };
  }
}

// Global WebSocket client instance
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (url: string): WebSocketClient | null => {
  // Don't create a WebSocket client if URL is empty
  if (!url) {
    console.warn('Cannot create WebSocket client: URL is empty');
    return null;
  }
  
  if (!wsClient) {
    console.log(`Creating new WebSocket client for URL: ${url}`);
    wsClient = new WebSocketClient(url);
  } else if (wsClient && wsClient['url'] !== url) {
    // If URL changed, close old connection and create new one
    console.log(`URL changed from ${wsClient['url']} to ${url}, reconnecting...`);
    wsClient.close(true);
    wsClient = new WebSocketClient(url);
  }
  return wsClient;
};

interface UseWebSocketReturn {
  send: (data: any) => boolean;
  reconnect: () => void;
  close: (permanent?: boolean) => void;
  status: 'connecting' | 'open' | 'closing' | 'closed';
  getStatus: () => 'connecting' | 'open' | 'closing' | 'closed';
  onStatusChange: (handler: (status: 'connecting' | 'open' | 'closing' | 'closed') => void) => () => void;
}

interface UseWebSocketOptions {
  onMessage?: MessageHandler;
  onError?: ErrorHandler;
  onClose?: CloseHandler;
  onStatusChange?: (status: 'connecting' | 'open' | 'closing' | 'closed') => void;
}

export const useWebSocket = (url: string, {
  onMessage,
  onError,
  onClose,
  onStatusChange
}: UseWebSocketOptions = {}): UseWebSocketReturn | null => {
  // If no URL is provided, return null and log a warning
  if (!url) {
    console.warn('useWebSocket: URL is empty, skipping WebSocket initialization');
    return null;
  }
  const clientRef = useRef<WebSocketClient | null>(null);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closing' | 'closed'>('closed');

  // Initialize WebSocket client and set up handlers
  useEffect(() => {
    if (!url) return;
    
    // Initialize WebSocket client
    const newClient = getWebSocketClient(url);
    if (!newClient) {
      console.error('Failed to create WebSocket client');
      return;
    }
    
    clientRef.current = newClient;
    
    // Set up handlers
    const cleanupFns: (() => void)[] = [];
    
    // Set up message handler
    if (onMessage) {
      cleanupFns.push(newClient.onMessage(onMessage));
    }
    
    // Set up error handler
    if (onError) {
      cleanupFns.push(newClient.onError(onError));
    }
    
    // Set up close handler
    if (onClose) {
      cleanupFns.push(newClient.onClose(onClose));
    }
    
    // Set up status change handler
    const handleStatusChange = (newStatus: 'connecting' | 'open' | 'closing' | 'closed') => {
      console.log('Status changed:', newStatus);
      setStatus(newStatus);
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    };
    
    // Subscribe to status changes
    const cleanupStatus = newClient.onStatusChange(handleStatusChange);
    
    // Initial status
    handleStatusChange(newClient.getStatus());
    
    // Clean up on unmount
    return () => {
      cleanupStatus();
      cleanupFns.forEach(cleanup => cleanup());
      // Note: We don't close the client here as it might be used by other components
    };
  }, [url, onMessage, onError, onClose, onStatusChange]);

  const send = useCallback((data: any) => {
    if (clientRef.current) {
      return clientRef.current.send(data);
    }
    return false;
  }, []);

  const reconnect = useCallback(() => {
    if (!clientRef.current) {
      console.warn('Cannot reconnect: WebSocket client not initialized');
      return;
    }
    
    clientRef.current.close();
    const newClient = getWebSocketClient(url);
    if (!newClient) {
      console.error('Failed to create new WebSocket client during reconnect');
      return;
    }
    
    clientRef.current = newClient;
    if (onMessage) clientRef.current.onMessage(onMessage);
    if (onError) clientRef.current.onError(onError);
    if (onClose) clientRef.current.onClose(onClose);
  }, [url, onMessage, onError, onClose]);

  const close = useCallback((permanent: boolean = false) => {
    if (clientRef.current) {
      clientRef.current.close(permanent);
    }
  }, []);

  const getStatus = useCallback(() => {
    return clientRef.current?.getStatus() || 'closed';
  }, []);
  
  // Add null check for clientRef.current in the effect
  useEffect(() => {
    const currentClient = clientRef.current;
    if (!currentClient) {
      console.warn('WebSocket client not available for cleanup');
      return;
    }
    
    if (onMessage) currentClient.onMessage(onMessage);
    if (onError) currentClient.onError(onError);
    if (onClose) currentClient.onClose(onClose);
    
    return () => {
      // Only clean up if this is the last reference
      if (currentClient) {
        currentClient.close();
      }
    };
  }, [onMessage, onError, onClose]);

  return url ? {
    send,
    reconnect,
    close,
    status,
    getStatus: () => status,
    onStatusChange: (handler: (status: 'connecting' | 'open' | 'closing' | 'closed') => void) => {
      if (!clientRef.current) return () => {};
      return clientRef.current.onStatusChange(handler);
    }
  } : null;
};

export default useWebSocket;
