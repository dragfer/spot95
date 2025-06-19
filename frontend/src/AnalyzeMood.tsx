import React, { useState, useEffect } from 'react';
import { useWindows } from './windows/WindowManager';

const MOODS = [
  {
    name: 'Chill',
    description: 'Relaxed and laid-back vibes',
    confidence: 85,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    name: 'Energetic',
    description: 'High-energy and upbeat tracks',
    confidence: 78,
    color: 'bg-yellow-500 hover:bg-yellow-600'
  },
  {
    name: 'Melancholic',
    description: 'Emotional and introspective tunes',
    confidence: 82,
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    name: 'Focused',
    description: 'Concentration-enhancing sounds',
    confidence: 75,
    color: 'bg-green-500 hover:bg-green-600'
  }
];

const AnalyzeMood = () => {
  const { openWindow } = useWindows();
  const [currentMood, setCurrentMood] = useState(0);
  
  // Only set a random mood once when the component mounts
  useEffect(() => {
    setCurrentMood(Math.floor(Math.random() * MOODS.length));
  }, []);

  const handleViewRecommendations = () => {
    openWindow('recommendations', { mood: MOODS[currentMood].name });
  };

  const mood = MOODS[currentMood];

  return (
    <div className="p-4 bg-gray-100 h-full">
      <h2 className="text-lg font-bold mb-4">Mood Analysis</h2>
      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-600">Current Mood:</div>
          <div className="font-medium">{mood.name}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Description:</div>
          <div>{mood.description}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Confidence:</div>
          <div>{mood.confidence}%</div>
        </div>
        <div className="pt-6">
          <button
            onClick={handleViewRecommendations}
            className={`px-4 py-2 text-white rounded-md transition-colors w-full max-w-xs ${mood.color}`}
          >
            View Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeMood;
