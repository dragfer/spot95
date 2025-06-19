// src/App.tsx
import { AuthProvider } from './contexts/AuthContext';
import { WindowProvider } from './windows/WindowManager';
import Desktop from './Desktop';
import Login from './Login';

function App() {
  const uid = localStorage.getItem('spotify_uid');

  return uid ? (
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
