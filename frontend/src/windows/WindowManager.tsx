import React, { createContext, useContext, useState, ReactNode } from 'react';

export type WindowType = 'dashboard' | 'profile' | 'mood' | 'recommendations';

export interface WindowInstance {
  id: number;
  type: WindowType;
  data?: any; // For passing data to the window (e.g., mood for recommendations)
}

interface WindowContextValue {
  windows: WindowInstance[];
  openWindow: (type: WindowType, data?: any) => void;
  closeWindow: (id: number) => void;
}

const WindowContext = createContext<WindowContextValue | undefined>(undefined);

let idCounter = 1;

export const WindowProvider = ({ children }: { children: ReactNode }) => {
  const [windows, setWindows] = useState<WindowInstance[]>([
    { id: idCounter++, type: 'dashboard' },
  ]);

  const openWindow = (type: WindowType, data?: any) =>
    setWindows((prev) => [...prev, { id: idCounter++, type, data }]);

  const closeWindow = (id: number) =>
    setWindows((prev) => prev.filter((w) => w.id !== id));

  return (
    <WindowContext.Provider value={{ windows, openWindow, closeWindow }}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindows = () => {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error('useWindows must be used within WindowProvider');
  return ctx;
};
