const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const publicUserSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarColor: true,
};

const createSchema = z.object({
  body: z.string().min(1).max(2000),
  title: z
    .object({
      tmdbId: z.number().int(),
      mediaType: z.enum(['MOVIE', 'TV']),
      title: z.string(),
      posterPath: z.string().nullable().optional(),
      overview: z.string().nullable().optional(),
      releaseYear: z.number().int().nullable().optional(),
      genres: z.array(z.string()).optional(),
    })
    .optional(),
});

const commentSchema = z.object({
  body: z.string().min(1).max(1000),
});

// POST /posts
router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { body, title } = parsed.data;

  let titleId = null;
  if (title) {
    const { tmdbId, mediaType, title: titleName, posterPath, overview, releaseYear, genres } = title;
    const dbTitle = await prisma.title.upsert({
      where: { tmdbId_mediaType: { tmdbId, mediaType } },
      // Non-destructive: only overwrite fields the client actually supplied,
      // so an existing Title's data (esp. genre names from /titles/:tmdbId)
      // is never clobbered by a sparser payload.
      update: {
        title: titleName,
        posterPath: posterPath ?? undefined,
        overview: overview ?? undefined,
        releaseYear: releaseYear ?? undefined,
        ...(genres && genres.length ? { genres } : {}),
      },
      create: { tmdbId, mediaType, title: titleName, posterPath, overview, releaseYear, genres: genres || [] },
    });
    titleId = dbTitle.id;
  }

  const post = await prisma.post.create({
    data: { userId: req.user.sub, body, titleId },
    include: { title: true, user: { select: publicUserSelect } },
  });

  res.status(201).json({ post });
});

// GET /posts/:id
router.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: publicUserSelect },
      title: true,
      comments: {
        include: { user: { select: publicUserSelect } },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const myLike = await prisma.like.findUnique({
    where: { userId_postId: { userId: req.user.sub, postId: post.id } },
  });

  const { _count, ...rest } = post;

  res.json({
    post: {
      ...rest,
      likeCount: _count.likes,
      likedByMe: Boolean(myLike),
    },
  });
});

// DELETE /posts/:id — own posts only (404 otherwise, matching watchlist.js)
router.delete('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });

  if (!post || post.userId !== req.user.sub) {
    return res.status(404).json({ error: 'Post not found' });
  }

  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /posts/:id/comments
router.post('/:id/comments', async (req, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const ops = [
    prisma.comment.create({
      data: { postId: post.id, userId: req.user.sub, body: parsed.data.body },
      include: { user: { select: publicUserSelect } },
    }),
  ];

  if (post.userId !== req.user.sub) {
    ops.push(
      prisma.notification.create({
        data: {
          recipientId: post.userId,
          actorId: req.user.sub,
          type: 'COMMENT',
          postId: post.id,
        },
      })
    );
  }

  const [comment] = await prisma.$transaction(ops);

  res.status(201).json({ comment });
});

module.exports = router;
