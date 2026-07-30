import { Link } from 'react-router-dom';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
const PLACEHOLDER = 'https://placehold.co/185x278/1f2937/9ca3af?text=No+Poster';

// Small poster + name card for a Title attached to a post or feed activity.
// Links to the existing title detail page.
export default function TitleAttachment({ title, compact = false }) {
  if (!title) return null;
  const mediaType = (title.mediaType || 'MOVIE').toLowerCase();
  const poster = title.posterPath ? `${TMDB_IMG}${title.posterPath}` : PLACEHOLDER;

  return (
    <Link
      to={`/title/${title.tmdbId}?type=${mediaType}`}
      className="flex items-center gap-3 p-2 rounded-lg bg-gray-100/60 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 hover:border-reelz-500/50 transition-colors"
    >
      <img
        src={poster}
        alt={title.title}
        className={`${compact ? 'w-10 h-15' : 'w-12 h-[4.5rem]'} object-cover rounded-md flex-shrink-0`}
      />
      <div className="min-w-0">
        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{title.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {title.releaseYear || ''}{title.releaseYear && title.mediaType ? ' · ' : ''}{title.mediaType === 'TV' ? 'TV Show' : title.mediaType ? 'Movie' : ''}
        </p>
      </div>
    </Link>
  );
}
