import React from 'react';
import { useWindows, WindowType } from './windows/WindowManager';
import RetroWindow from './components/RetroWindow';
import Dashboard from './Dashboard';
import Profile from './Profile';
import AnalyzeMood from './AnalyzeMood';
import Recommendations from './Recommendations';

const windowPositions: Record<WindowType, string> = {
  dashboard: 'absolute left-[2vw] top-[5vh]',
  profile: 'absolute right-[2vw] top-[5vh] w-72',
  mood: 'absolute right-[2vw] top-[calc(5vh+280px)] w-80',
  recommendations: 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] max-h-[80vh]',
};

const windowTitles: Record<WindowType, string> = {
  dashboard: "Spot' 95 - Dashboard",
  profile: 'Profile',
  mood: 'Analyze Mood',
  recommendations: 'Recommended Tracks',
};
const logout = () => {
  localStorage.clear();
  window.location.href = '/';
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

  return (
    <div className="relative w-full h-screen overflow-hidden">
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
