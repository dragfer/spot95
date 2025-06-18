import { useEffect, useState, useMemo } from 'react';
import { useWindows } from './windows/WindowManager';
import { useMoodUpdates, MoodData } from './hooks/useMoodUpdates';
import { useAuth } from './contexts/AuthContext';

// Mood color mapping
const MOOD_COLORS: Record<string, string> = {
  Upbeat: 'from-yellow-400 to-pink-500',
  Chill: 'from-blue-400 to-teal-400',
  Melancholic: 'from-purple-400 to-indigo-600',
  Energetic: 'from-red-500 to-orange-400',
  Focused: 'from-green-400 to-emerald-600',
  default: 'from-gray-400 to-gray-600',
};

// Connection status indicator
const ConnectionIndicator = ({ status }: { status: string }) => {
  const statusMap = {
    connecting: {
      text: 'Connecting...',
      color: 'bg-yellow-500',
      icon: '🔄',
    },
    open: {
      text: 'Connected',
      color: 'bg-green-500',
      icon: '✓',
    },
    closing: {
      text: 'Closing...',
      color: 'bg-yellow-500',
      icon: '⏳',
    },
    closed: {
      text: 'Disconnected',
      color: 'bg-red-500',
      icon: '✗',
    },
  };

  const { text, color, icon } = statusMap[status as keyof typeof statusMap] || 
    { text: 'Unknown', color: 'bg-gray-500', icon: '?' };

  return (
    <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
      <span className="mr-1">{icon}</span>
      <span>{text}</span>
      <span className={`ml-2 w-2 h-2 rounded-full ${color}`}></span>
    </div>
  );
};

// Audio feature progress bar
const AudioFeatureBar = ({ name, value }: { name: string; value: number }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs mb-1">
      <span className="capitalize">{name}</span>
      <span className="font-mono">{(value * 100).toFixed(0)}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div 
        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  </div>
);

export default function AnalyzeMood() {
  const { openWindow } = useWindows();
  const { user } = useAuth();
  const { 
    moodData, 
    isConnected, 
    error, 
    reconnect, 
    connectionStatus 
  } = useMoodUpdates();
  
  const [prevMood, setPrevMood] = useState<string | null>(null);
  const [showMoodChange, setShowMoodChange] = useState(false);
  
  // Track mood changes for animation
  useEffect(() => {
    if (moodData?.mood && moodData.mood !== prevMood) {
      if (prevMood !== null) {
        setShowMoodChange(true);
        const timer = setTimeout(() => setShowMoodChange(false), 3000);
        return () => clearTimeout(timer);
      }
      setPrevMood(moodData.mood);
    }
  }, [moodData?.mood, prevMood]);
  
  const moodColor = useMemo(() => {
    return MOOD_COLORS[moodData?.mood || ''] || MOOD_COLORS.default;
  }, [moodData?.mood]);
  
  const handleFetchRecommendations = () => {
    if (!moodData?.mood) return;
    openWindow('recommendations', { mood: moodData.mood });
  };
  
  // Show loading state while connecting
  if (!isConnected && connectionStatus !== 'open') {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="pt-4">
            <ConnectionIndicator status={connectionStatus} />
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state if there's an error
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={reconnect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reconnect
        </button>
      </div>
    );
  }
  
  // Show no active track state
  if (!moodData) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          No track currently playing. Start playing something on Spotify!
        </div>
        <div className="text-xs text-gray-400">
          <ConnectionIndicator status={connectionStatus} />
        </div>
      </div>
    );
  }
  
  const { mood, emoji, confidence, description, track, audio_features } = moodData;
  
  // Get top 3 audio features for display
  const topFeatures = useMemo(() => {
    if (!audio_features) return [];
    
    const features = Object.entries(audio_features)
      .filter(([key]) => key !== 'tempo' && key !== 'key' && key !== 'mode' && key !== 'time_signature')
      .map(([key, value]) => ({ name: key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
      
    return features;
  }, [audio_features]);

  return (
    <div className="p-6">
      {/* Connection status */}
      <div className="flex justify-end mb-4">
        <ConnectionIndicator status={connectionStatus} />
      </div>
      
      {/* Mood display with animation */}
      <div className={`text-center mb-6 transition-all duration-500 ${showMoodChange ? 'scale-110' : 'scale-100'}`}>
        <div className={`inline-block text-6xl mb-2 animate-bounce`}>
          {emoji}
        </div>
        <h2 className="text-2xl font-bold mb-1">
          {mood} Vibes
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {description}
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div 
            className={`h-2 rounded-full bg-gradient-to-r ${moodColor} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
      </div>
      
      {/* Current track */}
      {track && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3 flex items-center">
            <span className="mr-2">🎵</span> Now Playing
          </h3>
          <div className="flex items-center">
            {track.album_image && (
              <img 
                src={track.album_image} 
                alt="Album cover" 
                className="w-16 h-16 rounded-lg mr-4 shadow-md"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{track.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {track.artists.join(', ')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {track.album_name}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Audio features */}
      {topFeatures.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-3 flex items-center">
            <span className="mr-2">📊</span> Audio Features
          </h3>
          <div className="space-y-3">
            {topFeatures.map((feature) => (
              <AudioFeatureBar 
                key={feature.name} 
                name={feature.name} 
                value={feature.value} 
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations button */}
      <div className="text-center mt-8">
        <button
          onClick={handleFetchRecommendations}
          disabled={!isConnected}
          className={`px-6 py-2 rounded-full text-white font-medium transition-all
            ${isConnected 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transform hover:scale-105' 
              : 'bg-gray-400 cursor-not-allowed'}`}
        >
          Get {mood} Recommendations
        </button>
      </div>
    </div>
  );
}
