require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash = await bcrypt.hash('admin123', 12);
  const userHash = await bcrypt.hash('user123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@reelz.dev' },
    update: {},
    create: { email: 'admin@reelz.dev', passwordHash: adminHash, role: 'ADMIN' },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@reelz.dev' },
    update: {},
    create: { email: 'user@reelz.dev', passwordHash: userHash, role: 'USER' },
  });

  // Sample titles
  const titles = await Promise.all([
    prisma.title.upsert({
      where: { tmdbId_mediaType: { tmdbId: 550, mediaType: 'MOVIE' } },
      update: {},
      create: { tmdbId: 550, mediaType: 'MOVIE', title: 'Fight Club', posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', overview: 'A ticking-time-bomb insomniac and a slippery soap salesman.', releaseYear: 1999, genres: ['Drama', 'Thriller'] },
    }),
    prisma.title.upsert({
      where: { tmdbId_mediaType: { tmdbId: 238, mediaType: 'MOVIE' } },
      update: {},
      create: { tmdbId: 238, mediaType: 'MOVIE', title: 'The Godfather', posterPath: '/3bhkrj58Vtu7enYsLe1rjurvUho.jpg', overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.', releaseYear: 1972, genres: ['Drama', 'Crime'] },
    }),
    prisma.title.upsert({
      where: { tmdbId_mediaType: { tmdbId: 1396, mediaType: 'TV' } },
      update: {},
      create: { tmdbId: 1396, mediaType: 'TV', title: 'Breaking Bad', posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', overview: 'When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer.', releaseYear: 2008, genres: ['Drama', 'Crime', 'Thriller'] },
    }),
  ]);

  // Seed watchlist entries for demo user
  await prisma.watchlistEntry.upsert({
    where: { userId_titleId: { userId: user.id, titleId: titles[0].id } },
    update: {},
    create: { userId: user.id, titleId: titles[0].id, status: 'WATCHED', personalRating: 9, notes: 'Mind-blowing. Must rewatch.' },
  });
  await prisma.watchlistEntry.upsert({
    where: { userId_titleId: { userId: user.id, titleId: titles[2].id } },
    update: {},
    create: { userId: user.id, titleId: titles[2].id, status: 'WATCHING' },
  });

  // Seed a staff pick (only if none exist)
  const pickCount = await prisma.staffPick.count();
  if (pickCount === 0) {
    await prisma.staffPick.create({
      data: { titleId: titles[1].id, addedByAdminId: admin.id, note: 'A timeless masterpiece. Required viewing.' },
    });
  }

  console.log('✅ Seed complete!');
  console.log('   Admin: admin@reelz.dev / admin123');
  console.log('   User:  user@reelz.dev  / user123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
