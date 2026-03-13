// Production startup: run DB migrations, seed if empty, then start the server
const { execSync } = require('child_process');

console.log('🔄 Running database migrations…');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations complete');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}

console.log('🌱 Checking seed data…');
try {
  execSync('node src/scripts/seed.js', { stdio: 'inherit' });
} catch (err) {
  console.warn('⚠️  Seed warning:', err.message);
}

// Hand off to the main app
require('./index.js');
