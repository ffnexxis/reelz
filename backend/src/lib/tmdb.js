const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: API_KEY },
});

async function cachedGet(url, params = {}) {
  const key = url + JSON.stringify(params);
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await tmdb.get(url, { params });
  cache.set(key, res.data);
  return res.data;
}

async function searchTitles(query, type = 'multi') {
  if (!API_KEY) {
    return getMockSearchResults(query);
  }
  const endpoint = type === 'movie' ? '/search/movie' : type === 'tv' ? '/search/tv' : '/search/multi';
  const data = await cachedGet(endpoint, { query, include_adult: false });
  return data.results
    .filter(r => r.media_type !== 'person' || type !== 'multi')
    .map(normalizeTmdbResult);
}

async function getTitleDetails(tmdbId, mediaType = 'movie') {
  if (!API_KEY) {
    return getMockTitleDetails(tmdbId, mediaType);
  }
  const endpoint = mediaType === 'tv' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const [details, providers] = await Promise.all([
    cachedGet(endpoint, { append_to_response: 'credits,videos' }),
    cachedGet(`${endpoint}/watch/providers`),
  ]);
  return normalizeTmdbDetails(details, providers, mediaType);
}

async function getPopularTitles(mediaType = 'movie') {
  if (!API_KEY) {
    return getMockPopular();
  }
  const endpoint = mediaType === 'tv' ? '/tv/popular' : '/movie/popular';
  const data = await cachedGet(endpoint);
  return data.results.slice(0, 20).map(r => normalizeTmdbResult({ ...r, media_type: mediaType }));
}

function normalizeTmdbResult(r) {
  const isTV = r.media_type === 'tv' || r.first_air_date;
  return {
    tmdbId: r.id,
    mediaType: isTV ? 'TV' : 'MOVIE',
    title: r.title || r.name,
    posterPath: r.poster_path,
    overview: r.overview,
    releaseYear: r.release_date
      ? parseInt(r.release_date.slice(0, 4))
      : r.first_air_date
      ? parseInt(r.first_air_date.slice(0, 4))
      : null,
    voteAverage: r.vote_average,
    genres: r.genre_ids || [],
  };
}

function normalizeTmdbDetails(details, providers, mediaType) {
  const isTV = mediaType === 'tv';
  const usProviders = providers?.results?.US;
  const watchProviders = [
    ...(usProviders?.flatrate || []),
    ...(usProviders?.rent || []),
    ...(usProviders?.buy || []),
  ].filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i);

  return {
    tmdbId: details.id,
    mediaType: isTV ? 'TV' : 'MOVIE',
    title: details.title || details.name,
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    overview: details.overview,
    releaseYear: details.release_date
      ? parseInt(details.release_date.slice(0, 4))
      : details.first_air_date
      ? parseInt(details.first_air_date.slice(0, 4))
      : null,
    genres: (details.genres || []).map(g => g.name),
    voteAverage: details.vote_average,
    runtime: details.runtime || (details.episode_run_time?.[0] ?? null),
    watchProviders,
    tagline: details.tagline,
    status: details.status,
    numberOfSeasons: details.number_of_seasons,
    numberOfEpisodes: details.number_of_episodes,
  };
}

// ── Mock data for when no TMDB key is set ────────────────────────────────────

function getMockSearchResults(query) {
  return [
    { tmdbId: 550, mediaType: 'MOVIE', title: 'Fight Club', posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...', releaseYear: 1999, voteAverage: 8.4 },
    { tmdbId: 238, mediaType: 'MOVIE', title: 'The Godfather', posterPath: '/3bhkrj58Vtu7enYsLe1rjurvUho.jpg', overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.', releaseYear: 1972, voteAverage: 8.7 },
    { tmdbId: 1396, mediaType: 'TV', title: 'Breaking Bad', posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', overview: 'When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer...', releaseYear: 2008, voteAverage: 9.5 },
  ].filter(m => m.title.toLowerCase().includes(query.toLowerCase()) || query.length < 2);
}

function getMockTitleDetails(tmdbId, mediaType) {
  return {
    tmdbId: parseInt(tmdbId),
    mediaType: mediaType === 'tv' ? 'TV' : 'MOVIE',
    title: 'Fight Club',
    posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdropPath: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    releaseYear: 1999,
    genres: ['Drama', 'Thriller'],
    voteAverage: 8.4,
    runtime: 139,
    tagline: 'Mischief. Mayhem. Soap.',
    watchProviders: [
      { provider_id: 8, provider_name: 'Netflix', logo_path: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
      { provider_id: 9, provider_name: 'Amazon Prime Video', logo_path: '/emthp39XA2yngafY7QoWQ3cqAb.jpg' },
    ],
  };
}

function getMockPopular() {
  return [
    { tmdbId: 550, mediaType: 'MOVIE', title: 'Fight Club', posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', overview: 'A ticking-time-bomb insomniac...', releaseYear: 1999, voteAverage: 8.4 },
    { tmdbId: 238, mediaType: 'MOVIE', title: 'The Godfather', posterPath: '/3bhkrj58Vtu7enYsLe1rjurvUho.jpg', overview: 'Spanning the years 1945 to 1955...', releaseYear: 1972, voteAverage: 8.7 },
    { tmdbId: 424, mediaType: 'MOVIE', title: "Schindler's List", posterPath: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', overview: "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives...", releaseYear: 1993, voteAverage: 8.6 },
    { tmdbId: 1396, mediaType: 'TV', title: 'Breaking Bad', posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', overview: 'When Walter White...', releaseYear: 2008, voteAverage: 9.5 },
    { tmdbId: 1399, mediaType: 'TV', title: 'Game of Thrones', posterPath: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg', overview: 'Seven noble families fight for control...', releaseYear: 2011, voteAverage: 8.3 },
    { tmdbId: 66732, mediaType: 'TV', title: 'Stranger Things', posterPath: '/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg', overview: 'When a young boy vanishes...', releaseYear: 2016, voteAverage: 8.6 },
  ];
}

module.exports = { searchTitles, getTitleDetails, getPopularTitles };
