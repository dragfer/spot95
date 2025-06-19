// src/App.tsx
import { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { WindowProvider } from './windows/WindowManager';
import Desktop from './Desktop';
import Login from './Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status when component mounts
    const checkAuth = () => {
      const uid = localStorage.getItem('spotify_uid');
      setIsAuthenticated(!!uid);
    };

    checkAuth();

    // Listen for storage events to handle login/logout from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spotify_uid') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <AuthProvider>
      <WindowProvider>
        <Desktop />
      </WindowProvider>
    </AuthProvider>
  ) : (
    <Login />
  );
}

export default App;
