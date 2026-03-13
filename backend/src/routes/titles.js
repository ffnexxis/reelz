const express = require('express');
const prisma = require('../lib/prisma');
const { searchTitles, getTitleDetails, getPopularTitles } = require('../lib/tmdb');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /titles/search?q=&type=movie|tv|multi
router.get('/search', async (req, res) => {
  const { q, type = 'multi' } = req.query;
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await searchTitles(q.trim(), type);
    res.json({ results });
  } catch (err) {
    console.error('TMDB search error:', err.message);
    res.status(502).json({ error: 'Failed to fetch from TMDB', details: err.message });
  }
});

// GET /titles/popular?type=movie|tv
router.get('/popular', async (req, res) => {
  const { type = 'movie' } = req.query;
  try {
    const results = await getPopularTitles(type);
    res.json({ results });
  } catch (err) {
    console.error('TMDB popular error:', err.message);
    res.status(502).json({ error: 'Failed to fetch popular titles' });
  }
});

// GET /titles/:tmdbId?type=movie|tv
router.get('/:tmdbId', async (req, res) => {
  const { tmdbId } = req.params;
  const { type = 'movie' } = req.query;

  try {
    const details = await getTitleDetails(tmdbId, type);

    // Upsert into local DB for watchlist use
    const mediaType = type === 'tv' ? 'TV' : 'MOVIE';
    await prisma.title.upsert({
      where: { tmdbId_mediaType: { tmdbId: parseInt(tmdbId), mediaType } },
      update: {
        title: details.title,
        posterPath: details.posterPath,
        overview: details.overview,
        releaseYear: details.releaseYear,
        genres: details.genres || [],
      },
      create: {
        tmdbId: parseInt(tmdbId),
        mediaType,
        title: details.title,
        posterPath: details.posterPath,
        overview: details.overview,
        releaseYear: details.releaseYear,
        genres: details.genres || [],
      },
    });

    res.json(details);
  } catch (err) {
    console.error('TMDB details error:', err.message);
    res.status(502).json({ error: 'Failed to fetch title details', details: err.message });
  }
});

module.exports = router;
