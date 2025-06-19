// src/Login.tsx
export default function Login() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white border-4 border-black shadow-window w-[360px] md:w-[420px] text-center p-8 space-y-6">
        <h1 className="text-xl font-bold">Welcome to</h1>
        <h1 className="text-2xl font-retro">Spot' 95</h1>
        <a
          href={`${backendUrl}/api/auth/login`}
          className="inline-block bg-yellow-400 hover:bg-yellow-300 border-2 border-black px-6 py-3 font-retro transition-all"
        >
          Login with Spotify
        </a>
      </div>
    </div>
  );
}
