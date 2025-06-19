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
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

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
