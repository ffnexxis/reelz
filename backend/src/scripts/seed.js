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

  // ── Social layer: demo characters (idempotent — safe to re-run) ────────────
  const demoHash = await bcrypt.hash('demo123', 12);
  const demoProfiles = [
    { email: 'dan@reelz.dev', displayName: 'Dan', avatarColor: '#e11d48' },
    { email: 'chris@reelz.dev', displayName: 'Chris', avatarColor: '#0ea5e9' },
    { email: 'lisa@reelz.dev', displayName: 'Lisa', avatarColor: '#8b5cf6' },
    { email: 'john@reelz.dev', displayName: 'John', avatarColor: '#f59e0b' },
    { email: 'maria@reelz.dev', displayName: 'Maria', avatarColor: '#10b981' },
    { email: 'sam@reelz.dev', displayName: 'Sam', avatarColor: '#ec4899' },
  ];

  const demoUsers = [];
  for (const profile of demoProfiles) {
    demoUsers.push(
      await prisma.user.upsert({
        where: { email: profile.email },
        update: { displayName: profile.displayName, avatarColor: profile.avatarColor },
        create: { ...profile, passwordHash: demoHash, role: 'USER' },
      })
    );
  }
  const [dan, chris, lisa, john, maria, sam] = demoUsers;

  // Demo watch activity (drives the feed for anyone following them)
  const demoEntries = [
    { user: dan, title: titles[0], status: 'WATCHED', personalRating: 8 },
    { user: dan, title: titles[2], status: 'WATCHING' },
    { user: chris, title: titles[1], status: 'WATCHED', personalRating: 10 },
    { user: lisa, title: titles[2], status: 'WATCHED', personalRating: 9 },
    { user: john, title: titles[0], status: 'WANT_TO_WATCH' },
    { user: maria, title: titles[1], status: 'WATCHING' },
    { user: sam, title: titles[2], status: 'WANT_TO_WATCH' },
  ];
  for (const e of demoEntries) {
    await prisma.watchlistEntry.upsert({
      where: { userId_titleId: { userId: e.user.id, titleId: e.title.id } },
      update: {},
      create: {
        userId: e.user.id,
        titleId: e.title.id,
        status: e.status,
        personalRating: e.personalRating || null,
        watchedAt: e.status === 'WATCHED' ? new Date() : null,
      },
    });
  }

  // Follows among demo users + demo user follows for the sample user
  const followPairs = [
    [dan, chris], [dan, lisa], [chris, dan], [chris, maria],
    [lisa, dan], [lisa, sam], [john, dan], [maria, chris],
    [sam, lisa], [user, dan], [user, chris], [user, lisa],
  ];
  for (const [follower, following] of followPairs) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: follower.id, followingId: following.id } },
      update: {},
      create: { followerId: follower.id, followingId: following.id },
    });
  }

  // Sample posts + comments (only when no posts exist yet)
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    const danPost = await prisma.post.create({
      data: {
        userId: dan.id,
        body: 'Finally watched this — the first rule is not to talk about it, but I have to. Instant top 10.',
        titleId: titles[0].id,
      },
    });
    const lisaPost = await prisma.post.create({
      data: {
        userId: lisa.id,
        body: 'Weekend binge complete. What should I start next?',
        titleId: titles[2].id,
      },
    });
    await prisma.post.create({
      data: {
        userId: chris.id,
        body: 'Hot take: the sequel is even better than the original.',
        titleId: titles[1].id,
      },
    });

    await prisma.comment.create({
      data: { postId: danPost.id, userId: chris.id, body: 'Told you it would hold up!' },
    });
    await prisma.comment.create({
      data: { postId: danPost.id, userId: lisa.id, body: 'The twist got me too.' },
    });
    await prisma.comment.create({
      data: { postId: lisaPost.id, userId: sam.id, body: 'Better Call Saul, no question.' },
    });

    await prisma.like.create({ data: { userId: lisa.id, postId: danPost.id } });
    await prisma.like.create({ data: { userId: chris.id, postId: danPost.id } });
    await prisma.like.create({ data: { userId: dan.id, postId: lisaPost.id } });
  }

  console.log('✅ Seed complete!');
  console.log('   Admin: admin@reelz.dev / admin123');
  console.log('   User:  user@reelz.dev  / user123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
