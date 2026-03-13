import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
const PLACEHOLDER = 'https://placehold.co/185x278/f3f4f6/9ca3af?text=No+Poster';

export default function Trending() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getTrending()
      .then(res => setTrending(res.data.trending || []))
      .catch(() => setTrending([]))
      .finally(() => setLoading(false));
  }, []);

  const max = trending[0]?.addedCount || 1;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trending This Week</h1>
        <p className="text-gray-500 text-sm mt-1">Titles added most to watchlists in the last 7 days</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trending.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📈</p>
          <p>No tracking activity this week yet</p>
          <p className="text-sm mt-1">Data will appear as users add titles to their watchlists</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 hero cards */}
          {trending.length >= 3 && (
            <div className="grid grid-cols-3 gap-5 mb-6">
              {trending.slice(0, 3).map((item, i) => (
                <div key={item.id} className="card p-5 relative overflow-hidden">
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-100 text-gray-500">
                    #{i + 1}
                  </div>
                  <div className="flex gap-4">
                    <img
                      src={item.posterPath ? `${TMDB_IMG}${item.posterPath}` : PLACEHOLDER}
                      alt={item.title}
                      className="w-20 rounded-xl shadow-sm flex-shrink-0"
                      style={{ aspectRatio: '2/3', objectFit: 'cover' }}
                      onError={e => { e.target.src = PLACEHOLDER; }}
                    />
                    <div className="flex-1 min-w-0 pt-1">
                      <span className={`badge text-xs ${item.mediaType === 'TV' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {item.mediaType === 'TV' ? 'TV' : 'Movie'}
                      </span>
                      <h3 className="font-semibold text-gray-900 mt-1.5 line-clamp-2 leading-tight">
                        {item.title}
                      </h3>
                      {item.releaseYear && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.releaseYear}</p>
                      )}
                      <div className="mt-3">
                        <p className="text-2xl font-black text-brand-600">{item.addedCount}</p>
                        <p className="text-xs text-gray-400">adds this week</p>
                      </div>
                    </div>
                  </div>
                  {/* Bar */}
                  <div className="mt-4 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-purple-500 h-1.5 rounded-full"
                      style={{ width: `${Math.round((item.addedCount / max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rest as list */}
          <div className="card overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Trending Titles</p>
            </div>
            <div className="divide-y divide-gray-50">
              {trending.map((item, i) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <span className="text-sm font-bold text-gray-300 w-6 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <img
                    src={item.posterPath ? `${TMDB_IMG}${item.posterPath}` : PLACEHOLDER}
                    alt={item.title}
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0 shadow-sm"
                    onError={e => { e.target.src = PLACEHOLDER; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`badge text-xs ${item.mediaType === 'TV' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {item.mediaType}
                      </span>
                      {item.releaseYear && (
                        <span className="text-xs text-gray-400">{item.releaseYear}</span>
                      )}
                      {item.genres?.slice(0, 2).map(g => (
                        <span key={g} className="badge bg-gray-100 text-gray-400 text-xs">{g}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-purple-500 h-1.5 rounded-full"
                        style={{ width: `${Math.round((item.addedCount / max) * 100)}%` }}
                      />
                    </div>
                    <div className="text-right w-16">
                      <p className="text-sm font-bold text-brand-600">{item.addedCount}</p>
                      <p className="text-xs text-gray-400">adds</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
