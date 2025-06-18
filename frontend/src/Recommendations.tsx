import { useEffect, useState } from 'react';

type Track = { name: string; artists: string; url: string; image?: string | null };

interface RecommendationsProps {
  mood: string;
  onClose: () => void;
}

export default function Recommendations({ mood, onClose }: RecommendationsProps) {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('uid');
    
    if (!userId) {
      setError('User ID not found.');
      setLoading(false);
      return;
    }

    // Fetch recommendations when the component mounts
    fetch(`/api/analyze/${userId}/recommendations?mood=${encodeURIComponent(mood)}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to fetch recommendations');
        }
        return r.json();
      })
      .then((d) => {
        if (!d.tracks || !Array.isArray(d.tracks) || d.tracks.length === 0) {
          setError('No recommendations found for your vibe.');
          setTracks([]);
        } else {
          setTracks(d.tracks);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mood]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      <h2 className="text-xl font-bold mb-4 text-center sticky top-0 bg-white pb-2 border-b border-gray-200 z-10">
        {mood} Mood Tracks
      </h2>
      
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading recommendations…</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {tracks && tracks.length > 0 ? (
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tracks.map((t) => (
              <li 
                key={t.url} 
                className="flex flex-col items-center text-center space-y-2 border border-gray-200 p-3 bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
              >
                <div className="w-full aspect-square bg-gray-100 rounded-md overflow-hidden">
                  {t.image ? (
                    <img 
                      src={t.image} 
                      alt={t.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300';
                          fallback.textContent = '🎵';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                </div>
                <div className="w-full min-w-0">
                  <a 
                    href={t.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="block font-medium text-sm text-gray-900 hover:text-blue-600 truncate transition-colors"
                    title={t.name}
                  >
                    {t.name}
                  </a>
                  <span 
                    className="text-xs text-gray-600 truncate block"
                    title={t.artists}
                  >
                    {t.artists}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No recommendations found for your vibe.</p>
        </div>
      )}
    </div>
  );
}
