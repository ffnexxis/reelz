const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /notifications
router.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: req.user.sub },
    include: {
      actor: {
        select: { id: true, email: true, displayName: true, avatarColor: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({ notifications });
});

// GET /notifications/unread-count
router.get('/unread-count', async (req, res) => {
  const count = await prisma.notification.count({
    where: { recipientId: req.user.sub, read: false },
  });

  res.json({ count });
});

// POST /notifications/read-all
router.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { recipientId: req.user.sub, read: false },
    data: { read: true },
  });

  res.json({ success: true });
});

module.exports = router;
