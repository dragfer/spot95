import { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
}

interface AuthContextType {
  user: User | null;
}

const AuthContext = createContext<AuthContextType>({ user: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for UID in URL
    const params = new URLSearchParams(window.location.search);
    const urlUid = params.get('uid');

    if (urlUid) {
      localStorage.setItem('spot95_uid', urlUid);
      setUser({ id: urlUid });
      console.log('[AuthProvider] Saved UID from URL to localStorage:', urlUid);
    } else {
      const storedUid = localStorage.getItem('spot95_uid');
      if (storedUid) {
        setUser({ id: storedUid });
        console.log('[AuthProvider] Loaded UID from localStorage:', storedUid);
      } else {
        console.warn('[AuthProvider] No UID found in URL or localStorage.');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
