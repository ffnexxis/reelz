const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

router.use(requireAdmin);

// GET /admin/users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { watchlistEntries: true, customLists: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ users });
});

// GET /admin/stats
router.get('/stats', async (req, res) => {
  const [totalUsers, totalEntries, totalTitles, recentEntries, topTitles, genreAgg] = await Promise.all([
    prisma.user.count(),
    prisma.watchlistEntry.count(),
    prisma.title.count(),

    // Titles added in last 7 days
    prisma.watchlistEntry.findMany({
      where: { addedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      include: { title: true },
    }),

    // Most tracked titles overall
    prisma.watchlistEntry.groupBy({
      by: ['titleId'],
      _count: { titleId: true },
      orderBy: { _count: { titleId: 'desc' } },
      take: 5,
    }),

    // Genre data from all titles
    prisma.title.findMany({ select: { genres: true } }),
  ]);

  // Resolve top titles
  const topTitleIds = topTitles.map(t => t.titleId);
  const topTitleDetails = await prisma.title.findMany({ where: { id: { in: topTitleIds } } });
  const topTitlesWithCount = topTitles.map(t => ({
    ...topTitleDetails.find(d => d.id === t.titleId),
    count: t._count.titleId,
  }));

  // Tally genres
  const genreCounts = {};
  for (const t of genreAgg) {
    for (const g of t.genres) {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([genre, count]) => ({ genre, count }));

  // Weekly trending (most added in last 7 days)
  const weeklyMap = {};
  for (const e of recentEntries) {
    const key = e.titleId;
    if (!weeklyMap[key]) weeklyMap[key] = { title: e.title, count: 0 };
    weeklyMap[key].count++;
  }
  const weeklyTrending = Object.values(weeklyMap).sort((a, b) => b.count - a.count).slice(0, 5);

  res.json({
    totalUsers,
    totalEntries,
    totalTitles,
    topTitles: topTitlesWithCount,
    topGenres,
    weeklyTrending,
  });
});

// GET /admin/staff-picks
router.get('/staff-picks', async (req, res) => {
  const picks = await prisma.staffPick.findMany({
    include: {
      title: true,
      addedBy: { select: { id: true, email: true } },
    },
    orderBy: { featuredAt: 'desc' },
  });

  res.json({ picks });
});

const staffPickSchema = z.object({
  tmdbId: z.number().int(),
  mediaType: z.enum(['MOVIE', 'TV']),
  title: z.string(),
  posterPath: z.string().nullable().optional(),
  overview: z.string().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
  genres: z.array(z.union([z.string(), z.number().transform(n => String(n))])).optional(),
  note: z.string().optional(),
});

// POST /admin/staff-picks
router.post('/staff-picks', async (req, res) => {
  const parsed = staffPickSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });
  }

  const { tmdbId, mediaType, title, posterPath, overview, releaseYear, genres, note } = parsed.data;

  const dbTitle = await prisma.title.upsert({
    where: { tmdbId_mediaType: { tmdbId, mediaType } },
    update: { title, posterPath, overview, releaseYear, genres: genres || [] },
    create: { tmdbId, mediaType, title, posterPath, overview, releaseYear, genres: genres || [] },
  });

  const pick = await prisma.staffPick.create({
    data: {
      titleId: dbTitle.id,
      addedByAdminId: req.user.sub,
      note,
    },
    include: { title: true, addedBy: { select: { id: true, email: true } } },
  });

  res.status(201).json({ pick });
});

// DELETE /admin/staff-picks/:id
router.delete('/staff-picks/:id', async (req, res) => {
  const pick = await prisma.staffPick.findUnique({ where: { id: req.params.id } });
  if (!pick) {
    return res.status(404).json({ error: 'Staff pick not found' });
  }

  await prisma.staffPick.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// GET /admin/trending
router.get('/trending', async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const trendingRaw = await prisma.watchlistEntry.groupBy({
    by: ['titleId'],
    where: { addedAt: { gte: since } },
    _count: { titleId: true },
    orderBy: { _count: { titleId: 'desc' } },
    take: 20,
  });

  const ids = trendingRaw.map(t => t.titleId);
  const titles = await prisma.title.findMany({ where: { id: { in: ids } } });

  const trending = trendingRaw.map(t => ({
    ...titles.find(ti => ti.id === t.titleId),
    addedCount: t._count.titleId,
  }));

  res.json({ trending });
});

module.exports = router;
