import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { titlesApi, watchlistApi, listsApi } from '../api/client';
import StreamingBadge from '../components/StreamingBadge';

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          onClick={() => onChange(value === n ? null : n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          className={`text-xl transition-all ${
            n <= (hovered ?? value ?? 0) ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500'
          }`}
        >
          *
        </button>
      ))}
    </div>
  );
}

const STATUSES = [
  { value: 'WANT_TO_WATCH', label: 'Want to Watch', icon: 'Bookmark' },
  { value: 'WATCHING', label: 'Currently Watching', icon: 'Play' },
  { value: 'WATCHED', label: 'Watched', icon: 'Check' },
];

export default function TitleDetail() {
  const { tmdbId } = useParams();
  const [searchParams] = useSearchParams();
  const mediaType = searchParams.get('type') || 'movie';
  const navigate = useNavigate();

  const [title, setTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchlistEntry, setWatchlistEntry] = useState(null);
  const [lists, setLists] = useState([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [showAddToList, setShowAddToList] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      titlesApi.getDetails(tmdbId, mediaType),
      watchlistApi.get(),
      listsApi.getAll(),
    ])
      .then(([titleRes, wlRes, listsRes]) => {
        const t = titleRes.data;
        setTitle(t);
        const entries = wlRes.data.entries || [];
        const entry = entries.find(e => e.title?.tmdbId === t.tmdbId && e.title?.mediaType === t.mediaType);
        setWatchlistEntry(entry || null);
        if (entry) setNotes(entry.notes || '');
        setLists(listsRes.data.lists || []);
      })
      .catch(err => setError('Failed to load title details'))
      .finally(() => setLoading(false));
  }, [tmdbId, mediaType]);

  const handleAddToWatchlist = async (status = 'WANT_TO_WATCH') => {
    if (!title) return;
    setAdding(true);
    try {
      const { data } = await watchlistApi.add({
        tmdbId: title.tmdbId,
        mediaType: title.mediaType,
        title: title.title,
        posterPath: title.posterPath,
        overview: title.overview,
        releaseYear: title.releaseYear,
        genres: title.genres || [],
        status,
      });
      setWatchlistEntry(data.entry);
    } catch (err) {
      if (err.response?.status === 409) {
        const res = await watchlistApi.get();
        const entry = res.data.entries.find(e => e.title?.tmdbId === title.tmdbId);
        setWatchlistEntry(entry || null);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!watchlistEntry) return;
    setSaving(true);
    try {
      const { data } = await watchlistApi.update(watchlistEntry.id, { status });
      setWatchlistEntry(data.entry);
    } finally {
      setSaving(false);
    }
  };

  const handleRatingChange = async (rating) => {
    if (!watchlistEntry) return;
    const { data } = await watchlistApi.update(watchlistEntry.id, { personalRating: rating });
    setWatchlistEntry(data.entry);
  };

  const handleNoteSave = async () => {
    if (!watchlistEntry) return;
    setSaving(true);
    try {
      const { data } = await watchlistApi.update(watchlistEntry.id, { notes: notes || null });
      setWatchlistEntry(data.entry);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!watchlistEntry || !confirm('Remove from watchlist?')) return;
    await watchlistApi.remove(watchlistEntry.id);
    setWatchlistEntry(null);
    setNotes('');
  };

  const handleAddToList = async (listId) => {
    if (!title) return;
    try {
      await listsApi.addItem(listId, {
        tmdbId: title.tmdbId,
        mediaType: title.mediaType,
        title: title.title,
        posterPath: title.posterPath,
        overview: title.overview,
        releaseYear: title.releaseYear,
        genres: title.genres || [],
      });
      setShowAddToList(false);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !title) {
    return (
      <div className="text-center py-32 text-gray-500">
        <p className="text-lg">{error || 'Title not found'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Backdrop */}
      {title.backdropPath && (
        <div className="relative h-64 overflow-hidden">
          <img
            src={`${TMDB_BACKDROP}${title.backdropPath}`}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'blur(1px)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/40 to-gray-50 dark:from-gray-950/40 dark:to-gray-950" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Poster */}
          <div className="flex-shrink-0">
            <img
              src={title.posterPath ? `${TMDB_POSTER}${title.posterPath}` : 'https://placehold.co/300x450/1f2937/9ca3af?text=No+Poster'}
              alt={title.title}
              className="w-52 rounded-xl shadow-2xl shadow-black/40 dark:shadow-black/60 border border-gray-300/40 dark:border-gray-700/40"
              onError={e => { e.target.src = 'https://placehold.co/300x450/1f2937/9ca3af?text=No+Poster'; }}
            />
          </div>

          {/* Right: Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap mb-2">
              <span className={`badge text-sm px-3 py-1 ${title.mediaType === 'TV' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'}`}>
                {title.mediaType === 'TV' ? 'TV Series' : 'Movie'}
              </span>
              {title.releaseYear && (
                <span className="text-gray-500 dark:text-gray-400 text-sm">{title.releaseYear}</span>
              )}
              {title.runtime && (
                <span className="text-gray-500 text-sm">
                  {title.mediaType === 'TV' ? `${title.numberOfSeasons}s / ${title.numberOfEpisodes}ep` : `${title.runtime}m`}
                </span>
              )}
              {title.voteAverage > 0 && (
                <span className="badge bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm px-2.5">
                  {title.voteAverage?.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">{title.title}</h1>
            {title.tagline && (
              <p className="text-gray-500 dark:text-gray-400 italic text-sm mb-4">"{title.tagline}"</p>
            )}

            {/* Genres */}
            {title.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {title.genres.map(g => (
                  <span key={g} className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs">{g}</span>
                ))}
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{title.overview}</p>

            {/* Streaming providers */}
            {title.watchProviders?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Available on</p>
                <div className="flex flex-wrap gap-2">
                  {title.watchProviders.map(p => (
                    <StreamingBadge key={p.provider_id} provider={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Watchlist actions */}
            <div className="card-glass p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wider">My Status</h3>

              {!watchlistEntry ? (
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleAddToWatchlist(s.value)}
                      disabled={adding}
                      className="btn-secondary text-sm flex items-center gap-1.5"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status selector */}
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusChange(s.value)}
                        className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                          watchlistEntry.status === s.value
                            ? 'bg-reelz-600 text-white shadow-lg shadow-reelz-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Rating */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Personal rating</p>
                    <StarRating
                      value={watchlistEntry.personalRating}
                      onChange={handleRatingChange}
                    />
                    {watchlistEntry.personalRating && (
                      <p className="text-yellow-500 dark:text-yellow-400 text-sm mt-1 font-semibold">
                        {watchlistEntry.personalRating}/10
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Notes</p>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="input-field text-sm resize-none"
                      placeholder="Your thoughts, favorite moments..."
                    />
                    <button
                      onClick={handleNoteSave}
                      disabled={saving || notes === (watchlistEntry.notes || '')}
                      className="mt-2 btn-primary text-xs py-1.5 px-3 disabled:opacity-40"
                    >
                      {saving ? 'Saving...' : 'Save notes'}
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={handleRemove}
                    className="text-xs text-red-400 hover:text-red-500 dark:text-red-500/60 dark:hover:text-red-400 transition-colors"
                  >
                    Remove from watchlist
                  </button>
                </div>
              )}
            </div>

            {/* Add to list */}
            {lists.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowAddToList(!showAddToList)}
                  className="btn-secondary text-sm"
                >
                  + Add to a List
                </button>
                {showAddToList && (
                  <div className="mt-2 card-glass p-3 space-y-1">
                    {lists.map(list => (
                      <button
                        key={list.id}
                        onClick={() => handleAddToList(list.id)}
                        className="w-full text-left text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
                      >
                        {list.name}
                        <span className="text-gray-400 dark:text-gray-600 ml-2">{list._count?.items ?? 0} titles</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
