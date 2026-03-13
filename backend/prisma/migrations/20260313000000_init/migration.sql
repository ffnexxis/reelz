-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('WANT_TO_WATCH', 'WATCHING', 'WATCHED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titles" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "overview" TEXT,
    "releaseYear" INTEGER,
    "genres" TEXT[],

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL DEFAULT 'WANT_TO_WATCH',
    "personalRating" INTEGER,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchedAt" TIMESTAMP(3),

    CONSTRAINT "watchlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_list_items" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,

    CONSTRAINT "custom_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_picks" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "addedByAdminId" TEXT NOT NULL,
    "note" TEXT,
    "featuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_picks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "titles_tmdbId_mediaType_key" ON "titles"("tmdbId", "mediaType");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_entries_userId_titleId_key" ON "watchlist_entries"("userId", "titleId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_list_items_listId_titleId_key" ON "custom_list_items"("listId", "titleId");

-- AddForeignKey
ALTER TABLE "watchlist_entries" ADD CONSTRAINT "watchlist_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_entries" ADD CONSTRAINT "watchlist_entries_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_lists" ADD CONSTRAINT "custom_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_list_items" ADD CONSTRAINT "custom_list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "custom_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_list_items" ADD CONSTRAINT "custom_list_items_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_picks" ADD CONSTRAINT "staff_picks_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_picks" ADD CONSTRAINT "staff_picks_addedByAdminId_fkey" FOREIGN KEY ("addedByAdminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
