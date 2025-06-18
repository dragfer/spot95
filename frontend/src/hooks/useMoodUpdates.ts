import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../lib/websocket';

type MessageHandler = (data: any) => void;

export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  valence: number;
  [key: string]: number;
}

export interface TrackInfo {
  id: string;
  name: string;
  artists: string[];
  album_name: string;
  album_image?: string;
  duration_ms: number;
  progress_ms: number;
  is_playing: boolean;
  external_url?: string;
}

export interface MoodData {
  mood: string;
  emoji: string;
  confidence: number;
  description: string;
  track: TrackInfo;
  audio_features: AudioFeatures;
  timestamp: number;
}

interface UseMoodUpdatesReturn {
  moodData: MoodData | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed';
}

export const useMoodUpdates = (): UseMoodUpdatesReturn => {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closing' | 'closed'>('closed');
  const [error, setError] = useState<string | null>(null);

  // Determine WebSocket URL based on environment
  const getWebSocketUrl = useCallback((): string => {
    if (!user?.id) return '';
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use Vite's environment variables
    const host = import.meta.env.VITE_API_URL || window.location.host;
    return `${protocol}//${host}/ws/${user.id}`;
  }, [user?.id]);

  // Handle incoming WebSocket messages
  const handleMessage: MessageHandler = useCallback((data: any) => {
    if (data.type === 'mood_update') {
      setMoodData(data.data);
      setError(null);
    } else if (data.type === 'error') {
      setError(data.message || 'An error occurred');
    } else if (data.type === 'connection_established') {
      console.log('WebSocket connection established');
      setConnectionStatus('open');
      setError(null);
    }
  }, []);

  // Handle WebSocket errors
  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    setError('Connection error. Trying to reconnect...');
    setConnectionStatus('closed');
  }, []);

  // Handle WebSocket close
  const handleClose = useCallback(() => {
    console.log('WebSocket connection closed');
    setConnectionStatus('closed');
  }, []);

  // Initialize WebSocket connection
  const wsUrl = getWebSocketUrl();
  const { reconnect, getStatus } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    onError: handleError,
    onClose: handleClose,
  });

  // Update connection status when it changes
  useEffect(() => {
    const status = getStatus();
    setConnectionStatus(status);
    
    if (status === 'open') {
      setError(null);
    } else if (status === 'closed' && !error) {
      setError('Disconnected. Trying to reconnect...');
    }
  }, [getStatus, error]);

  // Reconnect when user changes or on mount
  useEffect(() => {
    if (user?.id) {
      reconnect();
    }
  }, [user?.id, reconnect]);

  // Auto-reconnect when connection is lost
  useEffect(() => {
    if (connectionStatus === 'closed' && !error) {
      const timer = setTimeout(() => {
        reconnect();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, error, reconnect]);

  return {
    moodData,
    isConnected: connectionStatus === 'open',
    error,
    reconnect,
    connectionStatus,
  };
};

export default useMoodUpdates;
