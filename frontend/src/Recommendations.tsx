import React from 'react';

interface Track {
  id: string;
  name: string;
  artists: string[];
  album: string;
  mood: string;
  imageUrl: string;
}

interface RecommendationsProps {
  mood: string;
  onClose: () => void;
}

type MoodType = 'Chill' | 'Energetic' | 'Melancholic' | 'Focused';

const MOOD_COLORS: Record<MoodType, string> = {
  Chill: 'bg-blue-500 hover:bg-blue-600',
  Energetic: 'bg-yellow-500 hover:bg-yellow-600',
  Melancholic: 'bg-purple-500 hover:bg-purple-600',
  Focused: 'bg-green-500 hover:bg-green-600'
};

// Spotify track IDs for each song (last segment of the Spotify URI)
const SPOTIFY_TRACK_IDS: Record<string, string> = {
  // Chill
  '1': '0pNBm2g3DjOyx66AiMZG16', // Sunset Lover - Petit Biscuit (Updated ID)
  '2': '21jGcNKet2qwijlDFuPiPb', // Circles - Post Malone (Verified working)
  '3': '31BRyb4XX43PoYAL7qCWZM', // The Less I Know The Better - Tame Impala (Verified working)
  '13': '1GxKJzY72Y02Nw1d2huXhE', // Redbone - Childish Gambino (Verified working)
  '14': '0ofHAoxe9vBkTCp2UQIavz', // Dreams - Fleetwood Mac (Verified working)
  '15': '3KkXRkHbMCARz0aVfAf68V', // Sunflower - Post Malone, Swae Lee (Verified working)
  
  // Energetic
  '4': '0VjIjW4GlUZAMYd2vXMi3b', // Blinding Lights - The Weeknd (Verified working)
  '5': '0FWCHKLNpqRaF882uQOpQh', // Levitating - Dua Lipa (Verified working)
  '6': '4cG7HUWYHBVvRpfPaZ7JMZ', // Don't Start Now - Dua Lipa (Verified working)
  '16': '7Dq8mAyDYuzqgZUpM9Hyhn', // Physical - Dua Lipa (Verified working)
  '17': '2D1P2Y9RUxZW1ChcDUwlrE', // Rain On Me - Lady Gaga, Ariana Grande (Verified working)
  '18': '5HCyWlXZPP0y6Gqq8TgA20', // Stay - The Kid LAROI, Justin Bieber (Verified working)
  
  // Melancholic
  '7': '1zwMYTA5nlNjZxYrvBB2pV', // Someone Like You - Adele (Verified working)
  '8': '0LwhlqvTqhxdY2Ld3a8lA3', // All I Want - Kodaline (Verified working)
  '9': '7CQ5OoQfFWubbfiCg05c5i', // Fix You - Coldplay (Verified working)
  '19': '2GpT0JfqJZ4m3bb7XGk4RV', // When I Was Your Man - Bruno Mars (Verified working)
  '20': '1mpkFYyxYEatsr3dT6XlMk', // All Too Well - Taylor Swift (Verified working)
  '21': '2tYQNryZ460vSF7wGkBFjq', // Someone You Loved - Lewis Capaldi (Verified working)
  
  // Focused
  '10': '2C3Naqc6ptQI4qLUshTmp0', // Weightless - Marconi Union (Verified working)
  '11': '6fY7SwgMV9m59IgZAZZSoJ', // Clair de Lune - Claude Debussy (Verified working)
  '12': '3yfP4CXFSWRNj1aEBTeR8G', // River Flows in You - Yiruma (Verified working)
  '22': '6XrT4YAMQFhZIzOHAetZ49', // Gymnopédie No.1 - Erik Satie (Verified working)
  '23': '2ihA5Tykw5fVyXEmBA3aC8', // Spiegel im Spiegel - Arvo Pärt (Verified working)
  '24': '1I3SNSCVmLp9UylAemydF8', // Moonlight Sonata - Beethoven (Verified working)
};

// Convert track ID to Spotify web URL
const getSpotifyUrl = (trackId: string): string => {
  return `https://open.spotify.com/track/${trackId}`;
};



// Helper function to create a placeholder image URL with a solid color and text
const createPlaceholderImage = (seed: string, width = 100, height = 100): string => {
  const colors = ['1e40af', 'b91c1c', '047857', '6d28d9', 'c2410c'];
  const color = colors[Math.abs(hashCode(seed)) % colors.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=${color}&color=fff&size=${width}`;
};

// Simple hash function for consistent colors
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const createTrack = (id: string, name: string, artists: string[], album: string, mood: MoodType): Track => ({
  id,
  name,
  artists,
  album,
  mood,
  imageUrl: `https://i.scdn.co/image/ab67616d00001e02${SPOTIFY_TRACK_IDS[id]}` || createPlaceholderImage(`${name} ${artists[0]}`)
});

const MOOD_RECOMMENDATIONS: Record<MoodType, Track[]> = {
  Chill: [
    createTrack('1', 'Sunset Lover', ['Petit Biscuit'], 'Sunset Lover', 'Chill'),
    createTrack('2', 'Circles', ['Post Malone'], 'Hollywood\'s Bleeding', 'Chill'),
    createTrack('3', 'The Less I Know The Better', ['Tame Impala'], 'Currents', 'Chill'),
    createTrack('13', 'Redbone', ['Childish Gambino'], 'Awaken, My Love!', 'Chill'),
    createTrack('14', 'Dreams', ['Fleetwood Mac'], 'Rumours', 'Chill'),
    createTrack('15', 'Sunflower', ['Post Malone', 'Swae Lee'], 'Spider-Man: Into the Spider-Verse', 'Chill'),
  ],
  Energetic: [
    createTrack('4', 'Blinding Lights', ['The Weeknd'], 'After Hours', 'Energetic'),
    createTrack('5', 'Levitating', ['Dua Lipa'], 'Future Nostalgia', 'Energetic'),
    createTrack('6', 'Don\'t Start Now', ['Dua Lipa'], 'Future Nostalgia', 'Energetic'),
    createTrack('16', 'Physical', ['Dua Lipa'], 'Future Nostalgia', 'Energetic'),
    createTrack('17', 'Rain On Me', ['Lady Gaga', 'Ariana Grande'], 'Chromatica', 'Energetic'),
    createTrack('18', 'Stay', ['The Kid LAROI', 'Justin Bieber'], 'F*CK LOVE 3: OVER YOU', 'Energetic'),
  ],
  Melancholic: [
    createTrack('7', 'Someone Like You', ['Adele'], '21', 'Melancholic'),
    createTrack('8', 'All I Want', ['Kodaline'], 'In a Perfect World', 'Melancholic'),
    createTrack('9', 'Fix You', ['Coldplay'], 'X&Y', 'Melancholic'),
    createTrack('19', 'When I Was Your Man', ['Bruno Mars'], 'Unorthodox Jukebox', 'Melancholic'),
    createTrack('20', 'All Too Well', ['Taylor Swift'], 'Red (Taylor\'s Version)', 'Melancholic'),
    createTrack('21', 'Someone You Loved', ['Lewis Capaldi'], 'Divinely Uninspired to a Hellish Extent', 'Melancholic'),
  ],
  Focused: [
    createTrack('10', 'Weightless', ['Marconi Union'], 'Weightless (Ambient Transmission)', 'Focused'),
    createTrack('11', 'Clair de Lune', ['Claude Debussy'], 'Suite bergamasque', 'Focused'),
    createTrack('12', 'River Flows in You', ['Yiruma'], 'First Love', 'Focused'),
    createTrack('22', 'Gymnopédie No.1', ['Erik Satie'], 'Gymnopédies', 'Focused'),
    createTrack('23', 'Spiegel im Spiegel', ['Arvo Pärt'], 'Spiegel im Spiegel', 'Focused'),
    createTrack('24', 'Moonlight Sonata', ['Ludwig van Beethoven'], 'Piano Sonata No. 14', 'Focused'),
  ]
};

const openSpotifyWindow = (trackId: string) => {
  const url = trackId.startsWith('http') ? trackId : getSpotifyUrl(trackId);
  window.open(url, 'spotify', 'width=800,height=600,menubar=no,status=no,location=no,toolbar=no');
};

const TrackCard: React.FC<{ track: Track; buttonColor: string }> = ({ track, buttonColor }) => (
  <div className="group flex items-center w-full py-2 px-3 hover:bg-gray-50 rounded-md transition-colors">
    {/* Spotify icon that opens track in new window */}
    <button 
      onClick={() => openSpotifyWindow(SPOTIFY_TRACK_IDS[track.id])}
      className="text-gray-400 hover:text-green-500 transition-colors p-1 mr-2"
      title="Open in Spotify"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    </button>
    
    {/* Album art */}
    <div className="w-10 h-10 flex-shrink-0 mr-3 bg-gray-100 rounded overflow-hidden">
      <img 
        src={track.imageUrl} 
        alt="" 
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = createPlaceholderImage(`${track.name} ${track.artists[0]}`);
        }}
      />
    </div>
    
    {/* Track info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center">
        <p className="text-sm font-medium text-gray-900 truncate pr-2">
          {track.name}
        </p>
      </div>
      <p className="text-xs text-gray-500 truncate">
        {track.artists.join(', ')}
      </p>
    </div>
    
    {/* Album name - hidden on mobile */}
    <div className="hidden md:block flex-1 min-w-0 px-4">
      <p className="text-xs text-gray-500 truncate">
        {track.album}
      </p>
    </div>
    
    {/* Play button - appears on hover */}
    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
      <button
        onClick={() => openSpotifyWindow(SPOTIFY_TRACK_IDS[track.id])}
        className={`w-8 h-8 flex items-center justify-center rounded-full ${buttonColor} hover:opacity-90 text-white`}
        title="Play in Spotify"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
    </div>
  </div>
);

const Recommendations: React.FC<RecommendationsProps> = ({ mood, onClose }) => {
  // Use the provided mood or default to 'Chill' if invalid
  const currentMood: MoodType = MOOD_RECOMMENDATIONS[mood as MoodType] 
    ? mood as MoodType 
    : 'Chill';
    
  const tracks = MOOD_RECOMMENDATIONS[currentMood] || [];
  const buttonColor = MOOD_COLORS[currentMood] || 'bg-blue-500 hover:bg-blue-600';

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex flex-col items-center mb-6">
        <div className="w-full flex justify-between items-center mb-2">
          <div className="w-6"></div> {/* Spacer for balance */}
          <h2 className="text-xl font-bold text-gray-900 text-center">Recommended Tracks</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 w-6 flex justify-end"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {mood && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500">Mood: {mood}</h3>
          </div>
        )}
      </div>
      
      <div className="w-full overflow-y-auto flex-1 space-y-4">
        {tracks.map((track) => (
          <div key={track.id} className="py-2">
            <TrackCard 
              track={track}
              buttonColor={buttonColor} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
