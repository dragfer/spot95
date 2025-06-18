import { useEffect, useState } from 'react';

interface UserData {
  display_name: string;
  avatar_url?: string | null;
  followers?: number | null;
  playlists?: number | null;
}

export default function Profile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    if (!uid) return;

    fetch(`/api/users/${uid}`)
      .then((r) => r.json())
      .then((d) => setUser(d))
      .catch(() => setError('Failed to load profile'));
  }, []);

  return (
    <>
      {error && <p className="text-red-600">{error}</p>}
      {user ? (
        <div className="flex flex-col items-center space-y-2">
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              alt="avatar"
              className="w-24 h-24 border-2 border-black shadow-lg object-cover"
            />
          )}
          <h2 className="text-lg">{user.display_name}</h2>
          <p>Followers: {user.followers ?? 0}</p>
          <p>Playlists: {user.playlists ?? 0}</p>
        </div>
      ) : (
        !error && <p>Loading…</p>
      )}
    </>
  );
}
