import React, { useState } from 'react';
import { useWindows, WindowType } from './windows/WindowManager';
import RetroWindow from './components/RetroWindow';
import Dashboard from './Dashboard';
import Profile from './Profile';
import AnalyzeMood from './AnalyzeMood'; 
import Recommendations from './Recommendations';

// Array of wallpaper file names in the public folder
const WALLPAPERS = [
  'wallpaper.jpg',
  'wallpaper2.jpeg',
  'wallpaper3.jpg',
  'wallpaper4.jpeg',
  'wallpaper5.jpg', 
  'wallpaper6.jpg',
  
  // Add more wallpaper files here as you add them to the public folder
  // Example: 'wallpaper2.jpg',
];

const windowPositions: Record<WindowType, string> = {
  dashboard: 'absolute left-[20px] top-[20px] w-[290px]',
  profile: 'absolute right-[20px] top-[20px] w-[350px]',
  mood: 'absolute right-[20px] top-[320px] w-[400px]',
  recommendations: 'absolute left-[340px] top-[20px] w-[calc(98vw-760px)] h-[calc(100vh-40px)]',
};

const windowTitles: Record<WindowType, string> = {
  dashboard: "Spot' 95 - Dashboard",
  profile: 'Profile',
  mood: 'Analyze Mood',
  recommendations: 'Recommended Tracks',
};

const getWindowContent = (type: WindowType, data?: any) => {
  switch (type) {
    case 'dashboard':
      return <Dashboard />;
    case 'profile':
      return <Profile />;
    case 'mood':
      return <AnalyzeMood />;
    case 'recommendations':
      return <Recommendations mood={data?.mood} onClose={() => {}} />;
    default:
      return null;
  }
};

export default function Desktop() {
  const { windows, closeWindow } = useWindows();
  const [currentWallpaper, setCurrentWallpaper] = useState(0);

  const nextWallpaper = () => {
    setCurrentWallpaper((prev) => (prev + 1) % WALLPAPERS.length);
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden"
      style={{ 
        backgroundImage: `url(/${WALLPAPERS[currentWallpaper]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'crisp-edges',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: 1000,
        willChange: 'transform',
        transition: 'background-image 0.5s ease-in-out'
      }}
    >
      {/* Wallpaper Changer Button */}
      <button
        onClick={nextWallpaper}
        className="absolute bottom-4 left-4 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200 backdrop-blur-sm border border-white/10 shadow-lg"
        title="Change Wallpaper"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        Wallpaper
      </button>

      {windows.map((win) => (
        <RetroWindow
          key={win.id}
          title={windowTitles[win.type]}
          onClose={() => closeWindow(win.id)}
          windowClass={windowPositions[win.type]}
          centered={win.type === 'recommendations'}
        >
          {getWindowContent(win.type, win.data)}
        </RetroWindow>
      ))}
    </div>
  );
}
