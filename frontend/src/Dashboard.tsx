import { useWindows, WindowType } from './windows/WindowManager';

export default function Dashboard() {
  const { openWindow } = useWindows();

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
