const TMDB_IMG = 'https://image.tmdb.org/t/p/w45';

export default function StreamingBadge({ provider }) {
  if (!provider) return null;

  return (
    <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2 py-1" title={provider.provider_name}>
      {provider.logo_path ? (
        <img
          src={`${TMDB_IMG}${provider.logo_path}`}
          alt={provider.provider_name}
          className="w-5 h-5 rounded"
        />
      ) : null}
      <span className="text-xs text-gray-300 font-medium">{provider.provider_name}</span>
    </div>
  );
}
