const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

function likeWhere(type, id) {
  return type === 'post' ? { postId: id } : { watchlistEntryId: id };
}

// POST /likes/:type/:id — :type is 'post' | 'activity' (activity id = watchlistEntryId)
router.post('/:type/:id', async (req, res) => {
  const { type, id } = req.params;

  if (type !== 'post' && type !== 'activity') {
    return res.status(400).json({ error: "type must be 'post' or 'activity'" });
  }

  let recipientId;
  let notificationPostId = null;

  if (type === 'post') {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    recipientId = post.userId;
    notificationPostId = post.id;
  } else {
    const entry = await prisma.watchlistEntry.findUnique({ where: { id } });
    if (!entry) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    recipientId = entry.userId;
  }

  const existing = await prisma.like.findFirst({
    where: { userId: req.user.sub, ...likeWhere(type, id) },
  });

  if (!existing) {
    const ops = [
      prisma.like.create({
        data: { userId: req.user.sub, ...likeWhere(type, id) },
      }),
    ];

    if (recipientId !== req.user.sub) {
      ops.push(
        prisma.notification.create({
          data: {
            recipientId,
            actorId: req.user.sub,
            type: 'LIKE',
            postId: notificationPostId,
          },
        })
      );
    }

    try {
      await prisma.$transaction(ops);
    } catch (err) {
      // Unique violation from a concurrent identical like — still idempotent
      if (err.code !== 'P2002') throw err;
    }
  }

  const likeCount = await prisma.like.count({ where: likeWhere(type, id) });

  res.json({ liked: true, likeCount });
});

// DELETE /likes/:type/:id — 200 even if no like existed
router.delete('/:type/:id', async (req, res) => {
  const { type, id } = req.params;

  if (type !== 'post' && type !== 'activity') {
    return res.status(400).json({ error: "type must be 'post' or 'activity'" });
  }

  await prisma.like.deleteMany({
    where: { userId: req.user.sub, ...likeWhere(type, id) },
  });

  const likeCount = await prisma.like.count({ where: likeWhere(type, id) });

  res.json({ liked: false, likeCount });
});

module.exports = router;
