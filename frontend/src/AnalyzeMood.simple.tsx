import React from 'react';

// Hardcoded mood data
const MOOD_DATA = {
  mood: 'Chill',
  emoji: '😌',
  confidence: 0.85,
  description: 'Relaxed and laid-back vibes',
  track: {
    name: 'Sunset Lover',
    artists: ['Petit Biscuit'],
    album_image: 'https://i.scdn.co/image/ab67616d0000b273d6f5f2d5f8d9e8c7d1b3e7f1c',
  },
  audio_features: {
    acousticness: 0.8,
    danceability: 0.7,
    energy: 0.5,
    instrumentalness: 0.9,
    liveness: 0.1,
    speechiness: 0.05,
    valence: 0.6
  }
};

// Mood color mapping
const MOOD_COLORS: Record<string, string> = {
  Upbeat: 'from-yellow-400 to-pink-500',
  Chill: 'from-blue-400 to-teal-400',
  Melancholic: 'from-purple-400 to-indigo-600',
  Energetic: 'from-red-500 to-orange-400',
  Focused: 'from-green-400 to-emerald-600',
  default: 'from-gray-400 to-gray-600',
};

// Audio feature progress bar
const AudioFeatureBar = ({ name, value }: { name: string; value: number }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
      <span>{name}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div 
        className="bg-blue-500 h-2 rounded-full" 
        style={{ width: `${value * 100}%` }}
      />
    </div>
  </div>
);

const AnalyzeMood = () => {
  const moodGradient = MOOD_COLORS[MOOD_DATA.mood as keyof typeof MOOD_COLORS] || MOOD_COLORS.default;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
            Current Mood
          </h2>
          <div className="text-green-500 text-sm font-medium mb-4">
            Connected
          </div>
        </div>

        {/* Mood Display */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-5xl mb-2">{MOOD_DATA.emoji}</div>
              <h1 
                className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${moodGradient}`}
              >
                {MOOD_DATA.mood}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {MOOD_DATA.description}
              </p>
              <div className="mt-2 text-sm text-gray-500">
                Confidence: {Math.round(MOOD_DATA.confidence * 100)}%
              </div>
            </div>
            
            {MOOD_DATA.track && (
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Now Playing</div>
                <div className="font-medium">{MOOD_DATA.track.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {MOOD_DATA.track.artists.join(', ')}
                </div>
                {MOOD_DATA.track.album_image && (
                  <img 
                    src={MOOD_DATA.track.album_image} 
                    alt="Album cover"
                    className="w-16 h-16 rounded-md mt-2 ml-auto"
                  />
                )}
              </div>
            )}
          </div>

          {/* Audio Features */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Audio Features
            </h3>
            <div className="space-y-3">
              {Object.entries(MOOD_DATA.audio_features).map(([key, value]) => (
                <AudioFeatureBar 
                  key={key} 
                  name={key.charAt(0).toUpperCase() + key.slice(1)} 
                  value={value as number} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeMood;
