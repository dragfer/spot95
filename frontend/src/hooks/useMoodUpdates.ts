import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../lib/websocket';

type MessageHandler = (data: any) => void;

export interface AudioFeatures {
  [key: string]: number;
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

  // Generate safe WebSocket URL
 const getWebSocketUrl = useCallback((): string => {
  if (!user?.id) {
    console.warn('[useMoodUpdates] No user ID found. Skipping WebSocket URL creation.');
    return '';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

  // Extract the host, fallback to current window if not defined
  let rawHost = import.meta.env.VITE_API_URL || window.location.host;

  // Sanitize: strip protocol (http:// or https://) if included
  rawHost = rawHost.replace(/^https?:\/\//, '');

  const finalUrl = `${protocol}://${rawHost}/ws/${user.id}`;
  console.log('[useMoodUpdates] Final WebSocket URL:', finalUrl);
  return finalUrl;
}, [user?.id]);


  // Memoized message handler
  const handleMessage: MessageHandler = useCallback((data) => {
    switch (data.type) {
      case 'mood_update':
        setMoodData(data.data);
        setError(null);
        break;
      case 'error':
        setError(data.message || 'Server error occurred.');
        break;
      case 'connection_established':
        console.log('✅ WebSocket connection established');
        setError(null);
        break;
    }
  }, []);

  const handleError = useCallback((err: Event) => {
    console.error('❌ WebSocket error:', err);
    setError('Connection error');
    setConnectionStatus('closed');
  }, []);

  const handleClose = useCallback(() => {
    console.warn('⚠️ WebSocket closed');
    setConnectionStatus('closed');
  }, []);

  const wsUrl = getWebSocketUrl();

  const { reconnect, getStatus } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    onError: handleError,
    onClose: handleClose,
  });

  useEffect(() => {
    const status = getStatus();
    setConnectionStatus(status);
    if (status !== 'open' && !error) {
      setError('Disconnected. Attempting reconnection...');
    }
  }, [getStatus, error]);

  useEffect(() => {
    if (user?.id && wsUrl) {
      reconnect();
    }
  }, [user?.id, wsUrl, reconnect]);

  useEffect(() => {
    if (connectionStatus === 'closed' && !error && wsUrl) {
      const timer = setTimeout(() => reconnect(), 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, error, reconnect, wsUrl]);

  return {
    moodData,
    isConnected: connectionStatus === 'open',
    error,
    reconnect,
    connectionStatus,
  };
};

export default useMoodUpdates;
