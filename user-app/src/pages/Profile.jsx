import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/UserAvatar';
import FollowButton from '../components/FollowButton';
import UserCard from '../components/UserCard';
import TitleAttachment from '../components/TitleAttachment';
import { getDisplayName } from '../utils/displayName';
import { timeAgo } from '../utils/timeAgo';

const VERBS = {
  WATCHED: 'watched',
  WATCHING: 'is watching',
  WANT_TO_WATCH: 'wants to watch',
};

const VERB_STYLES = {
  WATCHED: 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30',
  WATCHING: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30',
  WANT_TO_WATCH: 'bg-gray-200/50 dark:bg-gray-600/30 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600/40',
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Modal listing followers or following, loaded on open.
function ConnectionsModal({ userId, mode, onClose }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setUsers(null);
    setError(false);
    const fetcher = mode === 'followers' ? usersApi.getFollowers : usersApi.getFollowing;
    fetcher(userId)
      .then((res) => setUsers(res.data.users || []))
      .catch(() => setError(true));
  }, [userId, mode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="card-glass w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white capitalize">{mode}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {error ? (
            <p className="text-center text-sm text-red-500 dark:text-red-400 py-8">
              Couldn't load {mode}. Please try again.
            </p>
          ) : users === null ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
              {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          ) : (
            users.map((u) => <UserCard key={u.id} user={u} showFollowerCount={false} />)
          )}
        </div>
      </div>
    </div>
  );
}

// Inline edit affordance for your own display name.
function DisplayNameEditor({ profile, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const start = () => {
    setValue(profile.displayName || getDisplayName(profile));
    setError(false);
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      const trimmed = value.trim();
      const { data } = await usersApi.updateMe({ displayName: trimmed || null });
      const updated = data.user || {};
      onSaved(updated);
      // Keep the cached auth user in sync so the navbar picks it up on reload.
      try {
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        if (stored && stored.id === profile.id) {
          localStorage.setItem(
            'user',
            JSON.stringify({ ...stored, displayName: updated.displayName ?? (trimmed || null) })
          );
        }
      } catch {}
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={start}
        className="text-xs text-gray-400 hover:text-reelz-600 dark:text-gray-500 dark:hover:text-reelz-400 transition-colors"
      >
        Edit name
      </button>
    );
  }

  return (
    <form onSubmit={save} className="flex items-center gap-2 mt-1 flex-wrap">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={40}
        autoFocus
        placeholder="Display name"
        className="input-field text-sm py-1.5 w-48"
      />
      <button type="submit" disabled={saving} className="btn-primary text-xs py-1.5 px-3">
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-500 dark:text-red-400">Couldn't save.</span>}
    </form>
  );
}

function ActivityRow({ entry }) {
  const verb = VERBS[entry.status] || 'watched';
  const rated = entry.status === 'WATCHED' && entry.personalRating;
  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`badge text-xs px-2 py-0.5 ${VERB_STYLES[entry.status] || VERB_STYLES.WATCHED}`}>
          {verb}
        </span>
        {rated ? (
          <span className="text-xs font-medium text-yellow-500 dark:text-yellow-400">
            &#9733; {entry.personalRating}/10
          </span>
        ) : null}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {timeAgo(entry.watchedAt || entry.addedAt)}
        </span>
      </div>
      {entry.title && (
        <div className="max-w-sm">
          <TitleAttachment title={entry.title} compact />
        </div>
      )}
      {entry.notes && (
        <p className="mt-2 text-xs text-gray-500 italic line-clamp-2">"{entry.notes}"</p>
      )}
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 'notfound' | 'failed' | null
  const [connections, setConnections] = useState(null); // 'followers' | 'following' | null
  const [tab, setTab] = useState('activity'); // 'activity' | 'posts'

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    usersApi
      .getProfile(id)
      .then((res) => setProfile(res.data.user || res.data.profile || res.data))
      .catch((err) => {
        setProfile(null);
        setError(err?.response?.status === 404 ? 'notfound' : 'failed');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setConnections(null);
    setTab('activity');
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Spinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            {error === 'notfound' ? 'User not found' : "Couldn't load this profile"}
          </p>
          <p className="text-sm mt-1">
            {error === 'notfound' ? (
              <>
                They may have been removed.{' '}
                <Link
                  to="/people"
                  className="text-reelz-600 dark:text-reelz-400 hover:text-reelz-500 dark:hover:text-reelz-300"
                >
                  Find people to follow
                </Link>
              </>
            ) : (
              <button
                onClick={load}
                className="text-reelz-600 dark:text-reelz-400 hover:text-reelz-500 dark:hover:text-reelz-300"
              >
                Try again
              </button>
            )}
          </p>
        </div>
      </div>
    );
  }

  const isSelf = me?.id === profile.id;
  const activity = profile.activity || profile.watchlist || [];
  const posts = profile.posts || [];
  const lists = (profile.lists || []).filter((l) => l.isPublic !== false);
  const watchedCount = activity.filter((e) => e.status === 'WATCHED').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="card-glass p-6 mb-8">
        <div className="flex items-center gap-5">
          <UserAvatar user={profile} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white truncate">
                {getDisplayName(profile)}
              </h1>
              {isSelf && (
                <DisplayNameEditor
                  profile={profile}
                  onSaved={(updated) => setProfile((p) => ({ ...p, ...updated }))}
                />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{profile.email}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <button
                onClick={() => setConnections('followers')}
                className="text-gray-500 dark:text-gray-400 hover:text-reelz-600 dark:hover:text-reelz-400 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile.followerCount ?? 0}
                </span>{' '}
                follower{(profile.followerCount ?? 0) === 1 ? '' : 's'}
              </button>
              <button
                onClick={() => setConnections('following')}
                className="text-gray-500 dark:text-gray-400 hover:text-reelz-600 dark:hover:text-reelz-400 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile.followingCount ?? 0}
                </span>{' '}
                following
              </button>
              {watchedCount > 0 && (
                <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">
                  <span className="font-semibold text-gray-900 dark:text-white">{watchedCount}</span>{' '}
                  watched recently
                </span>
              )}
            </div>
          </div>
          {!isSelf && (
            <FollowButton
              userId={profile.id}
              isFollowing={!!profile.isFollowedByMe}
              onChange={(next) =>
                setProfile((p) => ({
                  ...p,
                  isFollowedByMe: next,
                  followerCount: Math.max(0, (p.followerCount ?? 0) + (next ? 1 : -1)),
                }))
              }
              className="flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'activity', label: 'Watch activity', count: activity.length },
          { value: 'posts', label: 'Posts', count: posts.length },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.value
                ? 'bg-reelz-600 text-white shadow-lg shadow-reelz-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 text-xs ${
                tab === t.value ? 'text-reelz-200' : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Watch activity / ratings */}
      {tab === 'activity' && (
        activity.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No watch activity yet</p>
            <p className="text-sm mt-1">
              {isSelf ? (
                <>
                  <Link
                    to="/"
                    className="text-reelz-600 dark:text-reelz-400 hover:text-reelz-500 dark:hover:text-reelz-300"
                  >
                    Discover titles
                  </Link>{' '}
                  to start tracking
                </>
              ) : (
                "They haven't tracked anything yet"
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </div>
        )
      )}

      {/* Posts */}
      {tab === 'posts' && (
        posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No posts yet</p>
            <p className="text-sm mt-1">
              {isSelf ? (
                <>
                  Share something from the{' '}
                  <Link
                    to="/feed"
                    className="text-reelz-600 dark:text-reelz-400 hover:text-reelz-500 dark:hover:text-reelz-300"
                  >
                    feed
                  </Link>
                </>
              ) : (
                "They haven't posted anything yet"
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/posts/${post.id}`)}
                className="card-glass p-4 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-700"
              >
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {post.body}
                </p>
                {post.title && (
                  <div className="mt-2 max-w-sm" onClick={(e) => e.stopPropagation()}>
                    <TitleAttachment title={post.title} compact />
                  </div>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{timeAgo(post.createdAt)}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* Public lists (rendered when the profile payload includes them) */}
      {lists.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Public lists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lists.map((list) => (
              <div key={list.id} className="card-glass p-4">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{list.name}</p>
                {list.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {list.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {(list._count?.items ?? list.items?.length ?? 0)}{' '}
                  {(list._count?.items ?? list.items?.length ?? 0) === 1 ? 'title' : 'titles'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {connections && (
        <ConnectionsModal userId={profile.id} mode={connections} onClose={() => setConnections(null)} />
      )}
    </div>
  );
}
