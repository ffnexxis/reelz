import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/client';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

function StatCard({ label, value, icon, color, darkColor, sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value ?? '---'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color} ${darkColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function GenreBar({ genre, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 dark:text-gray-400 w-24 truncate flex-shrink-0">{genre}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-brand-500 to-purple-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const maxGenreCount = stats?.topGenres?.[0]?.count || 1;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <StatCard
              label="Total Users"
              value={stats?.totalUsers?.toLocaleString()}
              icon="Users"
              color="bg-blue-50"
              darkColor="dark:bg-blue-500/10"
              sub="Registered accounts"
            />
            <StatCard
              label="Titles Tracked"
              value={stats?.totalEntries?.toLocaleString()}
              icon="Titles"
              color="bg-purple-50"
              darkColor="dark:bg-purple-500/10"
              sub="Across all watchlists"
            />
            <StatCard
              label="Unique Titles"
              value={stats?.totalTitles?.toLocaleString()}
              icon="Catalog"
              color="bg-green-50"
              darkColor="dark:bg-green-500/10"
              sub="In the catalog"
            />
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top genres */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">Top Genres</h2>
              {stats?.topGenres?.length > 0 ? (
                <div className="space-y-3">
                  {stats.topGenres.map(({ genre, count }) => (
                    <GenreBar key={genre} genre={genre} count={count} max={maxGenreCount} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No genre data yet</p>
              )}
            </div>

            {/* Most tracked */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Most Tracked Titles</h2>
                <Link to="/trending" className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium">
                  See trending
                </Link>
              </div>
              {stats?.topTitles?.length > 0 ? (
                <div className="space-y-3">
                  {stats.topTitles.map((title, i) => (
                    <div key={title.id} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-300 dark:text-gray-600 w-5 text-center">{i + 1}</span>
                      <img
                        src={title.posterPath ? `${TMDB_IMG}${title.posterPath}` : 'https://placehold.co/46x69/f3f4f6/9ca3af?text=?'}
                        alt={title.title}
                        className="w-9 h-14 object-cover rounded-lg flex-shrink-0"
                        onError={e => { e.target.src = 'https://placehold.co/46x69/f3f4f6/9ca3af?text=?'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{title.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`badge text-xs ${title.mediaType === 'TV' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'}`}>
                            {title.mediaType === 'TV' ? 'TV' : 'Movie'}
                          </span>
                          {title.releaseYear && (
                            <span className="text-xs text-gray-400">{title.releaseYear}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{title.count}</p>
                        <p className="text-xs text-gray-400">tracked</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No tracking data yet</p>
              )}
            </div>

            {/* Weekly trending preview */}
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Added This Week</h2>
                <span className="badge bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs px-2.5 py-1">Last 7 days</span>
              </div>
              {stats?.weeklyTrending?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {stats.weeklyTrending.map((item, i) => (
                    <div key={item.title?.id || i} className="flex flex-col items-center text-center gap-2">
                      <img
                        src={item.title?.posterPath ? `${TMDB_IMG}${item.title.posterPath}` : 'https://placehold.co/92x138/f3f4f6/9ca3af?text=?'}
                        alt={item.title?.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm"
                        onError={e => { e.target.src = 'https://placehold.co/92x138/f3f4f6/9ca3af?text=?'; }}
                      />
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{item.title?.title}</p>
                        <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">{item.count} adds</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No activity this week yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
