import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import RetroWindow from './components/RetroWindow';

type UserData = {
  display_name: string;
  avatar_url?: string | null;
  followers?: number | null;
  playlists?: number | null;
};

export default function UserInfo() {
  const { search } = useLocation();
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const params = new URLSearchParams(search);
  const uid = params.get('uid');

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    fetch(`/api/users/${uid}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((d) => {
        setUser(d);
        setError(false);
      })
      .catch((e) => {
        console.error('User fetch error', e);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [uid]);

  return (
    <RetroWindow title="User Info">
      {user ? (
        <div className="space-y-4">
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              alt="avatar"
              className="mx-auto w-24 h-24 border-2 border-black"
            />
          )}
          <h2 className="text-lg">{user.display_name}</h2>
          {typeof user.followers === 'number' && (
            <p>Followers: {user.followers}</p>
          )}
          {typeof user.playlists === 'number' && (
            <p>Playlists: {user.playlists}</p>
          )}
        </div>
      ) : (
        <p>Loading…</p>
      )}
    </RetroWindow>
  );
}
