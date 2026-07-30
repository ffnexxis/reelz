const express = require('express');
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

const VERBS = {
  WATCHED: 'watched',
  WATCHING: 'is watching',
  WANT_TO_WATCH: 'wants to watch',
};

// GET /feed?limit=
router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
  const me = req.user.sub;

  const follows = await prisma.follow.findMany({
    where: { followerId: me },
    select: { followingId: true },
  });
  const followedIds = follows.map((f) => f.followingId);

  if (followedIds.length === 0) {
    return res.json({ items: [] });
  }

  // Over-fetch each source, then merge-sort by timestamp and trim to limit.
  const fetchWindow = limit * 2;

  const [posts, entries] = await Promise.all([
    prisma.post.findMany({
      where: { userId: { in: followedIds } },
      include: {
        user: { select: publicUserSelect },
        title: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: fetchWindow,
    }),
    prisma.watchlistEntry.findMany({
      where: { userId: { in: followedIds } },
      include: {
        user: { select: publicUserSelect },
        title: true,
        _count: { select: { likes: true } },
      },
      orderBy: { addedAt: 'desc' },
      take: fetchWindow,
    }),
  ]);

  const myLikes = await prisma.like.findMany({
    where: {
      userId: me,
      OR: [
        { postId: { in: posts.map((p) => p.id) } },
        { watchlistEntryId: { in: entries.map((e) => e.id) } },
      ],
    },
    select: { postId: true, watchlistEntryId: true },
  });
  const likedPosts = new Set(myLikes.map((l) => l.postId).filter(Boolean));
  const likedEntries = new Set(myLikes.map((l) => l.watchlistEntryId).filter(Boolean));

  const postItems = posts.map((p) => ({
    id: `post:${p.id}`,
    type: 'post',
    user: p.user,
    createdAt: p.createdAt,
    likeCount: p._count.likes,
    likedByMe: likedPosts.has(p.id),
    body: p.body,
    title: p.title,
    commentCount: p._count.comments,
  }));

  const activityItems = entries.map((e) => ({
    id: `activity:${e.id}`,
    type: 'activity',
    user: e.user,
    createdAt: e.watchedAt || e.addedAt, // COALESCE(watchedAt, addedAt)
    likeCount: e._count.likes,
    likedByMe: likedEntries.has(e.id),
    title: e.title,
    status: e.status,
    personalRating: e.personalRating,
    verb: VERBS[e.status] || 'added',
  }));

  const items = [...postItems, ...activityItems]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  res.json({ items });
});

module.exports = router;
