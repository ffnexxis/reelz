import { useState, useEffect, useRef, useCallback } from 'react';
import { usersApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import UserCard from '../components/UserCard';

export default function People() {
  const { user: me } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const searching = query.trim().length > 0;

  const fetchUsers = useCallback((q) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    usersApi
      .search(q.trim())
      .then((res) => {
        if (id !== requestId.current) return;
        const list = res.data.users || [];
        setUsers(me?.id ? list.filter((u) => u.id !== me.id) : list);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setUsers([]);
        setError(true);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [me?.id]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(query), query.trim() ? 350 : 0);
    return () => clearTimeout(timer);
  }, [query, fetchUsers]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">People</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Follow friends to see what they&rsquo;re watching
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name or email…"
          className="input-field w-full pl-10 pr-10"
          autoComplete="off"
        />
        {searching && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Section label */}
      {!loading && !error && users.length > 0 && (
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {searching ? 'Results' : 'Suggested for you'}
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-600">
            {users.length} {users.length === 1 ? 'person' : 'people'}
          </span>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Couldn&rsquo;t load people
          </p>
          <p className="text-sm mt-1">Check your connection and try again</p>
          <button
            onClick={() => fetchUsers(query)}
            className="btn-secondary text-sm mt-4"
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            {searching ? `No people match "${query.trim()}"` : 'No one else is here yet'}
          </p>
          <p className="text-sm mt-1">
            {searching
              ? 'Try a different name or email'
              : 'Invite a friend to join Reelz'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
