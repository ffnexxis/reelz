const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const addItemSchema = z.object({
  tmdbId: z.number().int(),
  mediaType: z.enum(['MOVIE', 'TV']),
  title: z.string(),
  posterPath: z.string().nullable().optional(),
  overview: z.string().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
  genres: z.array(z.string()).optional(),
});

// GET /lists
router.get('/', async (req, res) => {
  const lists = await prisma.customList.findMany({
    where: { userId: req.user.sub },
    include: {
      items: {
        include: { title: true },
        take: 6, // preview posters
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ lists });
});

// GET /lists/:id
router.get('/:id', async (req, res) => {
  const list = await prisma.customList.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { title: true } },
      _count: { select: { items: true } },
    },
  });

  if (!list || list.userId !== req.user.sub) {
    return res.status(404).json({ error: 'List not found' });
  }

  res.json({ list });
});

// POST /lists
router.post('/', async (req, res) => {
  const parsed = createListSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const list = await prisma.customList.create({
    data: {
      userId: req.user.sub,
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });

  res.status(201).json({ list });
});

// DELETE /lists/:id
router.delete('/:id', async (req, res) => {
  const list = await prisma.customList.findUnique({ where: { id: req.params.id } });

  if (!list || list.userId !== req.user.sub) {
    return res.status(404).json({ error: 'List not found' });
  }

  await prisma.customList.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /lists/:id/items
router.post('/:id/items', async (req, res) => {
  const list = await prisma.customList.findUnique({ where: { id: req.params.id } });

  if (!list || list.userId !== req.user.sub) {
    return res.status(404).json({ error: 'List not found' });
  }

  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { tmdbId, mediaType, title, posterPath, overview, releaseYear, genres } = parsed.data;

  const dbTitle = await prisma.title.upsert({
    where: { tmdbId_mediaType: { tmdbId, mediaType } },
    update: { title, posterPath, overview, releaseYear, genres: genres || [] },
    create: { tmdbId, mediaType, title, posterPath, overview, releaseYear, genres: genres || [] },
  });

  const existing = await prisma.customListItem.findUnique({
    where: { listId_titleId: { listId: list.id, titleId: dbTitle.id } },
  });

  if (existing) {
    return res.status(409).json({ error: 'Title already in this list' });
  }

  const item = await prisma.customListItem.create({
    data: { listId: list.id, titleId: dbTitle.id },
    include: { title: true },
  });

  res.status(201).json({ item });
});

// DELETE /lists/:id/items/:titleId
router.delete('/:id/items/:titleId', async (req, res) => {
  const list = await prisma.customList.findUnique({ where: { id: req.params.id } });

  if (!list || list.userId !== req.user.sub) {
    return res.status(404).json({ error: 'List not found' });
  }

  const item = await prisma.customListItem.findUnique({
    where: { listId_titleId: { listId: req.params.id, titleId: req.params.titleId } },
  });

  if (!item) {
    return res.status(404).json({ error: 'Item not found in list' });
  }

  await prisma.customListItem.delete({
    where: { listId_titleId: { listId: req.params.id, titleId: req.params.titleId } },
  });

  res.json({ success: true });
});

module.exports = router;
