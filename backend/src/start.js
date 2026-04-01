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

// Only seed on a fresh database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(count => {
  if (count === 0) {
    console.log('🌱 Empty database — seeding…');
    try {
      execSync('node src/scripts/seed.js', { stdio: 'inherit' });
    } catch (err) {
      console.warn('⚠️  Seed warning:', err.message);
    }
  } else {
    console.log('🌱 Database already seeded — skipping.');
  }
}).catch(() => {}).finally(() => {
  prisma.$disconnect();
  require('./index.js');
});
