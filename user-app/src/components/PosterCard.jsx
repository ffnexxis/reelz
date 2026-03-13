import { Link } from 'react-router-dom';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
const PLACEHOLDER = 'https://placehold.co/342x513/1f2937/9ca3af?text=No+Poster';

const STATUS_COLORS = {
  WATCHED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  WATCHING: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  WANT_TO_WATCH: 'bg-gray-600/30 text-gray-400 border border-gray-600/40',
};

const STATUS_LABELS = {
  WATCHED: 'Watched',
  WATCHING: 'Watching',
  WANT_TO_WATCH: 'Want to Watch',
};

export default function PosterCard({ title, onAdd, onStatusChange, watchlistEntry, compact = false }) {
  const mediaType = (title.mediaType || 'MOVIE').toLowerCase();
  const posterUrl = title.posterPath
    ? `${TMDB_IMG}${title.posterPath}`
    : PLACEHOLDER;

  const rating = watchlistEntry?.personalRating;

  return (
    <div className="poster-card group">
      <Link to={`/title/${title.tmdbId}?type=${mediaType}`}>
        <img
          src={posterUrl}
          alt={title.title}
          className="poster-img"
          loading="lazy"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        <div className="poster-overlay" />

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={`badge ${title.mediaType === 'TV' ? 'bg-blue-500/80 text-blue-100' : 'bg-purple-500/80 text-purple-100'}`}>
            {title.mediaType === 'TV' ? 'TV' : 'Movie'}
          </span>
        </div>

        {/* Rating badge */}
        {rating && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-yellow-400/90 flex items-center justify-center">
            <span className="text-gray-900 text-xs font-bold">{rating}</span>
          </div>
        )}

        {/* Hover info */}
        {!compact && (
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{title.title}</p>
            {title.releaseYear && (
              <p className="text-gray-400 text-xs mt-0.5">{title.releaseYear}</p>
            )}
          </div>
        )}
      </Link>

      {/* Status indicator (when in watchlist) */}
      {watchlistEntry && (
        <div className="absolute bottom-2 left-2 right-2">
          <span className={`badge text-xs w-full text-center block ${STATUS_COLORS[watchlistEntry.status]}`}>
            {STATUS_LABELS[watchlistEntry.status]}
          </span>
        </div>
      )}

      {/* Add button (when not in watchlist) */}
      {onAdd && !watchlistEntry && (
        <button
          onClick={e => { e.preventDefault(); onAdd(title); }}
          className="absolute bottom-2 left-2 right-2 bg-reelz-600/90 hover:bg-reelz-500 text-white text-xs font-semibold py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
        >
          + Add to Watchlist
        </button>
      )}
    </div>
  );
}
