# Reelz 🎬

A personal movie & TV show tracker. Search anything, build your watchlist, rate what you've seen, and organize titles into custom lists. Admins get a dashboard to manage Staff Picks and see platform-wide trends.

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js · Express · Prisma ORM |
| Database | PostgreSQL 16 |
| User App | React · Vite · Tailwind CSS |
| Admin App | React · Vite · Tailwind CSS |
| Auth | JWT (access + refresh tokens) |
| External API | TMDB (The Movie Database) |
| Dev Infra | Docker Compose |

---

## Quick Start

### 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Node.js 20+ (for running outside Docker)
- A free TMDB API key (see below)

### 2. Get a TMDB API Key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org)
2. Go to **Settings → API** and request a Developer key
3. Copy your **API Read Access Token** (v4) or **API Key** (v3)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `TMDB_API_KEY` — your key from step 2
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate strong random strings:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### 4. Start Everything

```bash
docker compose up --build
```

This spins up:
| Service | URL |
|---|---|
| Backend API | http://localhost:4000 |
| User App | http://localhost:5173 |
| Admin App | http://localhost:5174 |
| PostgreSQL | localhost:5432 |

### 5. Run Database Migrations

In a new terminal (while Docker is running):

```bash
cd backend
npm install
npx prisma migrate dev --name init
```

Or exec into the backend container:

```bash
docker compose exec backend npx prisma migrate dev --name init
```

### 6. Seed an Admin User (Optional)

```bash
docker compose exec backend node src/scripts/seed.js
```

This creates:
- **Admin:** `admin@reelz.dev` / `admin123`
- **User:** `user@reelz.dev` / `user123`

---

## Running Without Docker

### Backend

```bash
cd backend
cp ../.env.example .env   # edit DATABASE_URL to point to your local Postgres
npm install
npx prisma migrate dev
npm run dev
```

### User App

```bash
cd user-app
npm install
npm run dev          # http://localhost:5173
```

### Admin App

```bash
cd admin-app
npm install
npm run dev          # http://localhost:5174
```

---

## Project Structure

```
reelz/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Data models
│   └── src/
│       ├── index.js             # Express entry point
│       ├── middleware/          # auth, admin guard
│       ├── routes/              # auth, titles, watchlist, lists, admin
│       └── lib/                 # prisma client, tmdb helper
├── user-app/                    # Dark-themed user-facing React app
│   └── src/
│       ├── pages/               # Home, Watchlist, Lists, TitleDetail
│       ├── components/          # Navbar, PosterCard, etc.
│       └── contexts/            # AuthContext
└── admin-app/                   # Light-themed admin React app
    └── src/
        ├── pages/               # Dashboard, Users, StaffPicks, Trending
        ├── components/          # Sidebar, etc.
        └── contexts/            # AuthContext
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, get tokens |
| POST | `/auth/refresh` | Refresh access token |

### Titles (TMDB Proxy)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/titles/search?q=&type=` | Search movies/TV |
| GET | `/titles/:tmdbId?type=` | Get title details |

### Watchlist (authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/watchlist` | Get your watchlist |
| POST | `/watchlist` | Add a title |
| PATCH | `/watchlist/:id` | Update status/rating/notes |
| DELETE | `/watchlist/:id` | Remove entry |

### Lists (authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/lists` | Get your custom lists |
| POST | `/lists` | Create a list |
| POST | `/lists/:id/items` | Add title to list |
| DELETE | `/lists/:id/items/:titleId` | Remove from list |

### Admin (admin role required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | All users |
| GET | `/admin/stats` | Platform statistics |
| POST | `/admin/staff-picks` | Feature a title |
| DELETE | `/admin/staff-picks/:id` | Remove staff pick |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for refresh tokens |
| `TMDB_API_KEY` | ✅ | TMDB API key (v3) |
| `PORT` | — | Backend port (default: 4000) |
| `VITE_API_URL` | — | API URL for frontend apps |
