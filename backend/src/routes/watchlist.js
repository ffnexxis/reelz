const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const addSchema = z.object({
  tmdbId: z.number().int(),
  mediaType: z.enum(['MOVIE', 'TV']),
  title: z.string(),
  posterPath: z.string().nullable().optional(),
  overview: z.string().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
  genres: z.array(z.string()).optional(),
  status: z.enum(['WANT_TO_WATCH', 'WATCHING', 'WATCHED']).optional(),
});

const updateSchema = z.object({
  status: z.enum(['WANT_TO_WATCH', 'WATCHING', 'WATCHED']).optional(),
  personalRating: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().nullable().optional(),
  watchedAt: z.string().datetime().nullable().optional(),
});

// GET /watchlist
router.get('/', async (req, res) => {
  const { status } = req.query;

  const entries = await prisma.watchlistEntry.findMany({
    where: {
      userId: req.user.sub,
      ...(status ? { status } : {}),
    },
    include: { title: true },
    orderBy: { addedAt: 'desc' },
  });

  res.json({ entries });
});

// POST /watchlist
router.post('/', async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { tmdbId, mediaType, title, posterPath, overview, releaseYear, genres, status } = parsed.data;

  // Upsert title
  const dbTitle = await prisma.title.upsert({
    where: { tmdbId_mediaType: { tmdbId, mediaType } },
    update: { title, posterPath, overview, releaseYear, genres: genres || [] },
    create: { tmdbId, mediaType, title, posterPath, overview, releaseYear, genres: genres || [] },
  });

  // Check if already in watchlist
  const existing = await prisma.watchlistEntry.findUnique({
    where: { userId_titleId: { userId: req.user.sub, titleId: dbTitle.id } },
  });

  if (existing) {
    return res.status(409).json({ error: 'Title already in watchlist', entry: existing });
  }

  const entry = await prisma.watchlistEntry.create({
    data: {
      userId: req.user.sub,
      titleId: dbTitle.id,
      status: status || 'WANT_TO_WATCH',
    },
    include: { title: true },
  });

  res.status(201).json({ entry });
});

// PATCH /watchlist/:id
router.patch('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const entry = await prisma.watchlistEntry.findUnique({
    where: { id: req.params.id },
  });

  if (!entry || entry.userId !== req.user.sub) {
    return res.status(404).json({ error: 'Watchlist entry not found' });
  }

  const updated = await prisma.watchlistEntry.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      watchedAt: parsed.data.status === 'WATCHED' && !entry.watchedAt ? new Date() : parsed.data.watchedAt,
    },
    include: { title: true },
  });

  res.json({ entry: updated });
});

// DELETE /watchlist/:id
router.delete('/:id', async (req, res) => {
  const entry = await prisma.watchlistEntry.findUnique({
    where: { id: req.params.id },
  });

  if (!entry || entry.userId !== req.user.sub) {
    return res.status(404).json({ error: 'Watchlist entry not found' });
  }

  await prisma.watchlistEntry.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
