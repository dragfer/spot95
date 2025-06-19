import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MoodData {
  mood: string;
  emoji: string;
  confidence: number;
  description: string;
  track?: {
    name: string;
    artists: string[];
    album_image: string;
  };
}

const useMoodUpdates = () => {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = useCallback(() => {
    if (!user?.id) {
      console.error('No user ID available for WebSocket connection');
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Clear any existing reconnect timer
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }

      // Create new WebSocket connection
      const wsUrl = `ws://${window.location.host}/ws/${user.id}`;
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          setMoodData(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Try to reconnect after a delay with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimer.current = window.setTimeout(() => {
            console.log('Reconnecting...');
            connectWebSocket();
          }, delay);
        } else {
          console.log('Max reconnection attempts reached');
          setError('Connection lost. Please refresh the page to try again.');
        }
      };

    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect to server');
    }
  }, [user?.id]);

  // Connect on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [connectWebSocket, user?.id]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    reconnectAttempts.current = 0; // Reset attempts on manual reconnect
    connectWebSocket();
  }, [connectWebSocket]);

  return {
    moodData,
    isConnected,
    error,
    reconnect,
  };
};

export default useMoodUpdates;
