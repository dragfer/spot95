import { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  windowClass?: string;
  centered?: boolean;
  onClose?: () => void;
}

export default function RetroWindow({ title, children, windowClass = '', centered = true, onClose }: Props) {
  const handleClose = () => {
    if (onClose) onClose();
  };
  return (
    <div className={centered ? 'flex items-center justify-center min-h-screen' : ''}>
      <div className={`bg-white border-4 border-black shadow-window text-center ${windowClass}`.trim()}>
        {/* title bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-gray-300 border-b-2 border-black text-xs">
          <span>{title}</span>
          <button onClick={handleClose} className="w-4 h-4 bg-red-600 text-white flex items-center justify-center font-bold leading-none border border-black hover:bg-red-500">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
