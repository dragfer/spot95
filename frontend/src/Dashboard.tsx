// src/Dashboard.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWindows, WindowType } from './windows/WindowManager';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openWindow } = useWindows();

  useEffect(() => {
    const uid = searchParams.get('uid');
    if (uid) {
      localStorage.setItem('spotify_uid', uid);
      console.log('[Dashboard] UID stored:', uid);
      // Force a page reload to update the App's auth state
      window.location.href = '/dashboard';
    } else if (!localStorage.getItem('spotify_uid')) {
      // If no UID in URL and not logged in, redirect to login
      window.location.href = '/';
      return;
    }
  }, [searchParams]);

  useEffect(() => {
    // After authentication, open the profile window by default
    if (localStorage.getItem('spotify_uid')) {
      openWindow('profile');
    }
  }, [openWindow]);

  const buttons: { label: string; type: WindowType }[] = [
    { label: 'Profile', type: 'profile' },
    { label: 'Analyze Mood', type: 'mood' },
  ];

  return (
    <div className="space-y-3">
      {buttons.map(({ label, type }) => (
        <button
          key={label}
          className="w-full bg-yellow-400 hover:bg-yellow-300 border-2 border-black py-2 text-sm"
          onClick={() => openWindow(type)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
