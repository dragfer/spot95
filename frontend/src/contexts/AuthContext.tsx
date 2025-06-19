// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
}

const AuthContext = createContext<{ user: User | null }>({ user: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem('spotify_uid');
    if (uid) {
      setUser({ id: uid });
      console.log('[AuthProvider] Loaded UID from localStorage:', uid);
    } else {
      console.warn('[AuthProvider] No UID found in localStorage.');
    }
  }, []);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
