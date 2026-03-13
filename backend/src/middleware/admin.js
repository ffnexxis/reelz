const { authenticate } = require('./auth');

function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

module.exports = { requireAdmin };
