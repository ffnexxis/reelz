import { useState, useEffect } from 'react';
import { postsApi, titlesApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
const PLACEHOLDER = 'https://placehold.co/92x138/1f2937/9ca3af?text=%20';

// Composer for new posts, with an optional attached title (searched via TMDB).
// Calls onCreated(post) after a successful create.
export default function PostComposer({ onCreated }) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // Title attach
  const [attaching, setAttaching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(null);

  useEffect(() => {
    if (!attaching || !query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      titlesApi.search(query, 'multi')
        .then((res) => setResults((res.data.results || []).slice(0, 5)))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [query, attaching]);

  const selectTitle = (t) => {
    setSelectedTitle(t);
    setAttaching(false);
    setQuery('');
    setResults([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const payload = { body: body.trim() };
      if (selectedTitle) {
        payload.title = {
          tmdbId: selectedTitle.tmdbId,
          mediaType: selectedTitle.mediaType,
          title: selectedTitle.title,
          posterPath: selectedTitle.posterPath,
          overview: selectedTitle.overview,
          releaseYear: selectedTitle.releaseYear,
          // NOTE: intentionally no `genres` — search results carry TMDB numeric
          // genre_ids, while Title.genres stores genre *names* (set by GET
          // /titles/:tmdbId). Sending ids would fail validation / corrupt data.
        };
      }
      const { data } = await postsApi.create(payload);
      setBody('');
      setSelectedTitle(null);
      onCreated?.(data.post);
    } catch {
      setError('Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card-glass p-4">
      <div className="flex gap-3">
        <UserAvatar user={user} size="md" />
        <div className="flex-1 min-w-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What are you watching?"
            rows={2}
            className="input-field w-full resize-none"
          />

          {selectedTitle && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-gray-100/60 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
              <img
                src={selectedTitle.posterPath ? `${TMDB_IMG}${selectedTitle.posterPath}` : PLACEHOLDER}
                alt={selectedTitle.title}
                className="w-8 h-12 object-cover rounded"
              />
              <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                {selectedTitle.title}{selectedTitle.releaseYear ? ` (${selectedTitle.releaseYear})` : ''}
              </span>
              <button
                type="button"
                onClick={() => setSelectedTitle(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm px-1"
                title="Remove title"
              >
                ✕
              </button>
            </div>
          )}

          {attaching && !selectedTitle && (
            <div className="mt-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a movie or show…"
                className="input-field w-full text-sm"
                autoFocus
              />
              {searching && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Searching…</p>
              )}
              {results.length > 0 && (
                <ul className="mt-1 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                  {results.map((t) => (
                    <li key={`${t.tmdbId}-${t.mediaType}`}>
                      <button
                        type="button"
                        onClick={() => selectTitle(t)}
                        className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <img
                          src={t.posterPath ? `${TMDB_IMG}${t.posterPath}` : PLACEHOLDER}
                          alt={t.title}
                          className="w-7 h-10 object-cover rounded"
                        />
                        <span className="text-sm text-gray-900 dark:text-white truncate">
                          {t.title}{t.releaseYear ? ` (${t.releaseYear})` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAttaching((a) => !a)}
              className="text-sm text-gray-500 hover:text-reelz-600 dark:text-gray-400 dark:hover:text-reelz-400 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              {selectedTitle ? 'Change title' : 'Attach a title'}
            </button>
            <button
              type="submit"
              disabled={!body.trim() || posting}
              className={`btn-primary text-sm ${!body.trim() || posting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
