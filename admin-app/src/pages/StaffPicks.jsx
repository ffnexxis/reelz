import { useState, useEffect, useCallback } from 'react';
import { adminApi, titlesApi } from '../api/client';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
const PLACEHOLDER = 'https://placehold.co/185x278/f3f4f6/9ca3af?text=No+Poster';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchResult({ result, onAdd }) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
      <img
        src={result.posterPath ? `${TMDB_IMG}${result.posterPath}` : PLACEHOLDER}
        alt={result.title}
        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
        onError={e => { e.target.src = PLACEHOLDER; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 line-clamp-1">{result.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`badge text-xs ${result.mediaType === 'TV' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
            {result.mediaType === 'TV' ? 'TV' : 'Movie'}
          </span>
          {result.releaseYear && (
            <span className="text-xs text-gray-400">{result.releaseYear}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onAdd(result)}
        className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
      >
        Feature
      </button>
    </div>
  );
}

function PickCard({ pick, onRemove }) {
  const title = pick.title;
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove "${title.title}" from Staff Picks?`)) return;
    setRemoving(true);
    try {
      await onRemove(pick.id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="card p-4 flex gap-4 group hover:shadow-md transition-shadow">
      <img
        src={title.posterPath ? `${TMDB_IMG}${title.posterPath}` : PLACEHOLDER}
        alt={title.title}
        className="w-16 h-24 object-cover rounded-xl flex-shrink-0 shadow-sm"
        onError={e => { e.target.src = PLACEHOLDER; }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{title.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`badge text-xs ${title.mediaType === 'TV' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                {title.mediaType === 'TV' ? 'TV' : 'Movie'}
              </span>
              {title.releaseYear && (
                <span className="text-xs text-gray-400">{title.releaseYear}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="btn-danger text-xs py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            {removing ? '…' : 'Remove'}
          </button>
        </div>

        {pick.note && (
          <p className="text-sm text-gray-500 italic mt-2 line-clamp-2">"{pick.note}"</p>
        )}

        {title.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {title.genres.slice(0, 3).map(g => (
              <span key={g} className="badge bg-gray-100 text-gray-500 text-xs">{g}</span>
            ))}
          </div>
        )}

        <div className="mt-2 text-xs text-gray-400">
          Featured by {pick.addedBy?.email} · {new Date(pick.featuredAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export default function StaffPicks() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('multi');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    adminApi.getStaffPicks()
      .then(res => setPicks(res.data.picks || []))
      .catch(() => setPicks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    titlesApi.search(debouncedQuery, filter)
      .then(res => setSearchResults(res.data.results || []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery, filter]);

  const handleSelectForPick = useCallback((result) => {
    setNoteFor(result);
    setNote('');
    setQuery('');
    setSearchResults([]);
  }, []);

  const handleConfirmAdd = async () => {
    if (!noteFor) return;
    setAdding(true);
    try {
      const { data } = await adminApi.addStaffPick({
        tmdbId: noteFor.tmdbId,
        mediaType: noteFor.mediaType,
        title: noteFor.title,
        posterPath: noteFor.posterPath,
        overview: noteFor.overview,
        releaseYear: noteFor.releaseYear,
        genres: noteFor.genres || [],
        note: note || undefined,
      });
      setPicks(prev => [data.pick, ...prev]);
      setNoteFor(null);
      setNote('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add staff pick');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = useCallback(async (id) => {
    await adminApi.removeStaffPick(id);
    setPicks(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Staff Picks</h1>
        <p className="text-gray-500 text-sm mt-1">Curate featured titles shown to all users on the home screen</p>
      </div>

      {/* Search to add */}
      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">+</span>
          Feature a new title
        </h2>

        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {searching ? (
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search TMDB for a movie or TV show…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {['multi', 'movie', 'tv'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {t === 'multi' ? 'All' : t === 'movie' ? 'Movies' : 'TV'}
              </button>
            ))}
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {searchResults.slice(0, 8).map(result => (
              <SearchResult key={`${result.tmdbId}-${result.mediaType}`} result={result} onAdd={handleSelectForPick} />
            ))}
          </div>
        )}

        {/* Note editor */}
        {noteFor && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={noteFor.posterPath ? `${TMDB_IMG}${noteFor.posterPath}` : PLACEHOLDER}
                alt={noteFor.title}
                className="w-10 h-14 object-cover rounded-lg"
                onError={e => { e.target.src = PLACEHOLDER; }}
              />
              <div>
                <p className="font-medium text-gray-800">{noteFor.title}</p>
                <p className="text-xs text-gray-400">{noteFor.releaseYear} · {noteFor.mediaType}</p>
              </div>
            </div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Editorial note (optional — shown to users)
            </label>
            <input
              type="text"
              className="input text-sm"
              placeholder="e.g. A timeless masterpiece. Required viewing."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleConfirmAdd}
                disabled={adding}
                className="btn-primary flex items-center gap-2"
              >
                {adding && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {adding ? 'Adding…' : '★ Feature This Title'}
              </button>
              <button onClick={() => setNoteFor(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Picks list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Current Staff Picks</h2>
          <span className="badge bg-brand-100 text-brand-700 text-xs px-2.5 py-1">
            {picks.length} featured
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : picks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">⭐</p>
            <p>No staff picks yet. Search above to add the first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {picks.map(pick => (
              <PickCard key={pick.id} pick={pick} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
