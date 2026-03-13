import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { watchlistApi } from '../api/client';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
const PLACEHOLDER = 'https://placehold.co/185x278/1f2937/9ca3af?text=No+Poster';

const STATUSES = [
  { value: '', label: 'All', color: 'text-gray-300' },
  { value: 'WANT_TO_WATCH', label: 'Want to Watch', color: 'text-gray-400' },
  { value: 'WATCHING', label: 'Watching', color: 'text-blue-400' },
  { value: 'WATCHED', label: 'Watched', color: 'text-green-400' },
];

const STATUS_STYLES = {
  WATCHED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  WATCHING: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  WANT_TO_WATCH: 'bg-gray-600/30 text-gray-400 border border-gray-600/40',
};

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          onClick={() => onChange(value === n ? null : n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          className={`text-sm transition-colors ${
            n <= (hovered ?? value ?? 0) ? 'text-yellow-400' : 'text-gray-700'
          }`}
          title={`${n}/10`}
        >
          ★
        </button>
      ))}
      {value && (
        <span className="ml-1 text-xs text-yellow-400 font-medium">{value}/10</span>
      )}
    </div>
  );
}

function WatchlistItem({ entry, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(entry.status);
  const [rating, setRating] = useState(entry.personalRating);
  const [notes, setNotes] = useState(entry.notes || '');
  const [saving, setSaving] = useState(false);

  const title = entry.title;
  const mediaType = (title.mediaType || 'MOVIE').toLowerCase();

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate(entry.id, { status, personalRating: rating, notes: notes || null });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      await onUpdate(entry.id, { status: newStatus });
    } catch {}
  };

  return (
    <div className="card-glass p-4 flex gap-4 group transition-all hover:border-gray-700">
      {/* Poster */}
      <Link to={`/title/${title.tmdbId}?type=${mediaType}`} className="flex-shrink-0">
        <img
          src={title.posterPath ? `${TMDB_IMG}${title.posterPath}` : PLACEHOLDER}
          alt={title.title}
          className="w-16 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={`/title/${title.tmdbId}?type=${mediaType}`}
              className="font-semibold text-white hover:text-reelz-400 transition-colors line-clamp-1"
            >
              {title.title}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              {title.releaseYear && (
                <span className="text-xs text-gray-500">{title.releaseYear}</span>
              )}
              <span className={`badge text-xs ${title.mediaType === 'TV' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {title.mediaType === 'TV' ? 'TV' : 'Movie'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button
              onClick={() => onRemove(entry.id)}
              className="text-xs text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Status quick-change */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {STATUSES.slice(1).map(s => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              className={`badge text-xs px-2 py-0.5 transition-all ${
                status === s.value
                  ? STATUS_STYLES[s.value]
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Rating */}
        <div className="mt-2">
          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* Genres */}
        {title.genres?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {title.genres.slice(0, 3).map(g => (
              <span key={g} className="badge bg-gray-800/60 text-gray-500 text-xs">{g}</span>
            ))}
          </div>
        )}

        {/* Edit panel */}
        {editing && (
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="input-dark text-sm resize-none"
                placeholder="Your thoughts…"
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}

        {/* Notes preview */}
        {!editing && entry.notes && (
          <p className="mt-2 text-xs text-gray-500 italic line-clamp-2">"{entry.notes}"</p>
        )}
      </div>
    </div>
  );
}

export default function Watchlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    setLoading(true);
    watchlistApi.get()
      .then(res => setEntries(res.data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = useCallback(async (id, data) => {
    const { data: res } = await watchlistApi.update(id, data);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...res.entry } : e));
  }, []);

  const handleRemove = useCallback(async (id) => {
    await watchlistApi.remove(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const filtered = entries.filter(e => !filter || e.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.addedAt) - new Date(a.addedAt);
    if (sortBy === 'rating') return (b.personalRating || 0) - (a.personalRating || 0);
    if (sortBy === 'title') return a.title.title.localeCompare(b.title.title);
    return 0;
  });

  const counts = {
    '': entries.length,
    WANT_TO_WATCH: entries.filter(e => e.status === 'WANT_TO_WATCH').length,
    WATCHING: entries.filter(e => e.status === 'WATCHING').length,
    WATCHED: entries.filter(e => e.status === 'WATCHED').length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">My Watchlist</h1>
        <p className="text-gray-400">
          {entries.length} {entries.length === 1 ? 'title' : 'titles'} tracked
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === s.value
                  ? 'bg-reelz-600 text-white shadow-lg shadow-reelz-500/20'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {s.label}
              <span className={`ml-1.5 text-xs ${filter === s.value ? 'text-reelz-200' : 'text-gray-600'}`}>
                {counts[s.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="sm:ml-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input-dark text-sm py-2 w-full sm:w-auto"
          >
            <option value="recent">Recently added</option>
            <option value="rating">Highest rated</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">🍿</p>
          <p className="text-lg font-medium text-gray-400">
            {filter ? 'No titles with this status' : 'Your watchlist is empty'}
          </p>
          <p className="text-sm mt-1">
            {filter ? 'Try a different filter' : (
              <>
                <Link to="/" className="text-reelz-400 hover:text-reelz-300">Discover titles</Link> to add them here
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(entry => (
            <WatchlistItem
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
