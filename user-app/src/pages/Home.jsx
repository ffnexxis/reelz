import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { titlesApi, watchlistApi } from '../api/client';
import PosterCard from '../components/PosterCard';
import StreamingBadge from '../components/StreamingBadge';

const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w342';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [popular, setPopular] = useState([]);
  const [staffPicks, setStaffPicks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('multi');
  const debouncedQuery = useDebounce(query, 400);
  const searchRef = useRef(null);

  // Load initial data
  useEffect(() => {
    Promise.all([
      titlesApi.getPopular('movie').catch(() => ({ data: { results: [] } })),
      titlesApi.getStaffPicks().catch(() => ({ data: { picks: [] } })),
      watchlistApi.get().catch(() => ({ data: { entries: [] } })),
    ]).then(([popRes, picksRes, wlRes]) => {
      setPopular(popRes.data.results || []);
      setStaffPicks(picksRes.data.picks || []);
      setWatchlist(wlRes.data.entries || []);
    });
  }, []);

  // Search
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

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleAdd = useCallback(async (title) => {
    const key = `${title.tmdbId}-${title.mediaType}`;
    setAddingId(key);
    try {
      const { data } = await watchlistApi.add({
        tmdbId: title.tmdbId,
        mediaType: title.mediaType,
        title: title.title,
        posterPath: title.posterPath,
        overview: title.overview,
        releaseYear: title.releaseYear,
        genres: title.genres || [],
      });
      setWatchlist(wl => [...wl, data.entry]);
      showToast(`"${title.title}" added to watchlist!`);
    } catch (err) {
      if (err.response?.status === 409) {
        showToast('Already in your watchlist', 'info');
      } else {
        showToast('Failed to add to watchlist', 'error');
      }
    } finally {
      setAddingId(null);
    }
  }, [showToast]);

  const getWatchlistEntry = (title) =>
    watchlist.find(e => e.title?.tmdbId === title.tmdbId && e.title?.mediaType === title.mediaType);

  const displayTitles = query.trim() ? searchResults : popular;
  const isSearchMode = !!query.trim();

  // Featured staff pick for hero
  const featured = staffPicks[0]?.title;

  return (
    <div className="min-h-screen">
      {/* ── Hero / Staff Pick Spotlight ───────────────────────────────────── */}
      {featured && !isSearchMode && (
        <div className="relative h-[480px] overflow-hidden">
          <img
            src={featured.posterPath ? `${TMDB_BACKDROP}${featured.posterPath}` : ''}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{ filter: 'blur(2px)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/30" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="flex items-center gap-8 w-full">
              <Link to={`/title/${featured.tmdbId}?type=${featured.mediaType === 'TV' ? 'tv' : 'movie'}`}>
                <img
                  src={featured.posterPath ? `${TMDB_POSTER}${featured.posterPath}` : ''}
                  alt={featured.title}
                  className="hidden md:block w-44 rounded-xl shadow-2xl shadow-black/60 border border-gray-700/50 hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <div className="flex-1 max-w-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge bg-reelz-500/80 text-white text-xs px-2.5 py-1">
                    ★ Staff Pick
                  </span>
                  {staffPicks[0]?.note && (
                    <span className="text-xs text-gray-400 italic">"{staffPicks[0].note}"</span>
                  )}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2">
                  {featured.title}
                </h2>
                {featured.releaseYear && (
                  <p className="text-gray-400 text-sm mb-3">{featured.releaseYear}</p>
                )}
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 mb-5">
                  {featured.overview}
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/title/${featured.tmdbId}?type=${featured.mediaType === 'TV' ? 'tv' : 'movie'}`}
                    className="btn-primary"
                  >
                    View Details
                  </Link>
                  {!getWatchlistEntry(featured) && (
                    <button
                      onClick={() => handleAdd(featured)}
                      className="btn-secondary"
                    >
                      + Watchlist
                    </button>
                  )}
                  {getWatchlistEntry(featured) && (
                    <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5">
                      ✓ In your list
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {searching ? (
                  <div className="w-4 h-4 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              <input
                ref={searchRef}
                type="text"
                className="input-dark pl-11 text-base"
                placeholder="Search movies & TV shows…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {['multi', 'movie', 'tv'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === t
                      ? 'bg-reelz-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t === 'multi' ? 'All' : t === 'movie' ? 'Movies' : 'TV'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Picks row (when not searching) */}
        {!isSearchMode && staffPicks.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-reelz-400 to-purple-500 rounded-full" />
              <h2 className="text-lg font-bold text-white">Staff Picks</h2>
              <span className="badge bg-reelz-500/20 text-reelz-400 border border-reelz-500/30">Curated</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {staffPicks.slice(0, 8).map(pick => (
                <PosterCard
                  key={pick.id}
                  title={pick.title}
                  onAdd={handleAdd}
                  watchlistEntry={getWatchlistEntry(pick.title)}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        {/* Search results / Popular grid */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full" />
            <h2 className="text-lg font-bold text-white">
              {isSearchMode ? `Results for "${query}"` : 'Popular Right Now'}
            </h2>
            {displayTitles.length > 0 && (
              <span className="text-sm text-gray-500">{displayTitles.length} titles</span>
            )}
          </div>

          {displayTitles.length === 0 && !searching && (
            <div className="text-center py-16 text-gray-500">
              {isSearchMode ? (
                <>
                  <p className="text-4xl mb-3">🎬</p>
                  <p>No results found for "{query}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </>
              ) : (
                <>
                  <p className="text-4xl mb-3">🎬</p>
                  <p>Discover movies and TV shows</p>
                  <p className="text-sm mt-1">Search above to get started</p>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayTitles.map(title => (
              <PosterCard
                key={`${title.tmdbId}-${title.mediaType}`}
                title={title}
                onAdd={handleAdd}
                watchlistEntry={getWatchlistEntry(title)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 transition-all animate-in ${
          toast.type === 'error'
            ? 'bg-red-500/90 text-white'
            : toast.type === 'info'
            ? 'bg-gray-700 text-gray-200'
            : 'bg-green-500/90 text-white'
        }`}>
          {toast.type === 'success' && <span>✓</span>}
          {toast.type === 'error' && <span>✕</span>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
