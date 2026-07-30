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

const updateMeSchema = z.object({
  displayName: z.string().trim().min(1).max(50).nullable().optional(),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
});

async function followedIdSet(userId) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return new Set(follows.map((f) => f.followingId));
}

// GET /users/search?q= — must be registered BEFORE /users/:id
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();

  const users = await prisma.user.findMany({
    where: {
      id: { not: req.user.sub },
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      ...publicUserSelect,
      _count: { select: { followers: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const followed = await followedIdSet(req.user.sub);

  res.json({
    users: users.map(({ _count, ...u }) => ({
      ...u,
      followerCount: _count.followers,
      isFollowedByMe: followed.has(u.id),
    })),
  });
});

// GET /users/me
router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { ...publicUserSelect, role: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

// PATCH /users/me
router.patch('/me', async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.update({
    where: { id: req.user.sub },
    data: parsed.data,
    select: { ...publicUserSelect, role: true, createdAt: true },
  });

  res.json({ user });
});

// GET /users/:id — public profile
router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      ...publicUserSelect,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const [posts, activity, myFollow] = await Promise.all([
    prisma.post.findMany({
      where: { userId: user.id },
      include: { title: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.watchlistEntry.findMany({
      where: { userId: user.id },
      // Explicit select: `notes` is private and must NOT leak into the
      // public profile (mirrors the fields feed.js exposes).
      select: {
        id: true,
        status: true,
        personalRating: true,
        addedAt: true,
        watchedAt: true,
        title: true,
      },
      orderBy: { addedAt: 'desc' },
      take: 10,
    }),
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.sub,
          followingId: user.id,
        },
      },
    }),
  ]);

  const { _count, ...rest } = user;

  res.json({
    user: {
      ...rest,
      followerCount: _count.followers,
      followingCount: _count.following,
      isFollowedByMe: Boolean(myFollow),
      posts,
      activity,
    },
  });
});

// GET /users/:id/followers
router.get('/:id/followers', async (req, res) => {
  const follows = await prisma.follow.findMany({
    where: { followingId: req.params.id },
    include: { follower: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' },
  });

  const followed = await followedIdSet(req.user.sub);

  res.json({
    users: follows.map((f) => ({
      ...f.follower,
      isFollowedByMe: followed.has(f.follower.id),
    })),
  });
});

// GET /users/:id/following
router.get('/:id/following', async (req, res) => {
  const follows = await prisma.follow.findMany({
    where: { followerId: req.params.id },
    include: { following: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' },
  });

  const followed = await followedIdSet(req.user.sub);

  res.json({
    users: follows.map((f) => ({
      ...f.following,
      isFollowedByMe: followed.has(f.following.id),
    })),
  });
});

// POST /users/:id/follow — idempotent
router.post('/:id/follow', async (req, res) => {
  const targetId = req.params.id;

  if (targetId === req.user.sub) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: req.user.sub,
        followingId: targetId,
      },
    },
  });

  if (existing) {
    return res.json({ following: true });
  }

  try {
    await prisma.$transaction([
      prisma.follow.create({
        data: { followerId: req.user.sub, followingId: targetId },
      }),
      prisma.notification.create({
        data: {
          recipientId: targetId,
          actorId: req.user.sub,
          type: 'FOLLOW',
        },
      }),
    ]);
  } catch (err) {
    // Unique violation from a concurrent identical follow — still idempotent
    if (err.code !== 'P2002') throw err;
  }

  res.json({ following: true });
});

// DELETE /users/:id/follow — 200 even if no follow existed
router.delete('/:id/follow', async (req, res) => {
  await prisma.follow.deleteMany({
    where: { followerId: req.user.sub, followingId: req.params.id },
  });

  res.json({ following: false });
});

module.exports = router;
