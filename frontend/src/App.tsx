import { useLocation } from 'react-router-dom';
import { WindowProvider } from './windows/WindowManager';
import { AuthProvider } from './contexts/AuthContext';
import Desktop from './Desktop';
import Login from './Login';

function App() {
  const location = useLocation();

  // Show login page if there's no UID, otherwise show the desktop
  if (!location.search.includes('uid=')) {
    return <Login />;
  }

  return (
    <AuthProvider>
      <WindowProvider>
        <Desktop />
      </WindowProvider>
    </AuthProvider>
  );
}

export default App;

