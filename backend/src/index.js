require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const titlesRoutes = require('./routes/titles');
const watchlistRoutes = require('./routes/watchlist');
const listsRoutes = require('./routes/lists');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security & middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173', // user app
    'http://localhost:5174', // admin app
    process.env.USER_APP_URL,
    process.env.ADMIN_APP_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use(limiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authLimiter, authRoutes);
app.use('/titles', titlesRoutes);
app.use('/watchlist', watchlistRoutes);
app.use('/lists', listsRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 / Error handlers ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🎬 Reelz API running on http://localhost:${PORT}`);
});
