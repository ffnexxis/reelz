# Deploying Reelz to Railway

## Overview

Railway will host 4 services from this monorepo:

| Service | Root directory | URL you'll get |
|---|---|---|
| PostgreSQL | (managed plugin) | internal |
| backend | `backend/` | `reelz-backend.up.railway.app` |
| user-app | `user-app/` | `reelz-user.up.railway.app` |
| admin-app | `admin-app/` | `reelz-admin.up.railway.app` |

---

## Step 1 — Push to GitHub

Railway deploys from Git. Create a repo and push:

```bash
cd "c:/Users/fireglass/Documents/claude projects/reelz"
git init
git add .
git commit -m "Initial commit"
```

Then create a new repo on GitHub (e.g. `reelz`) and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/reelz.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `reelz` repo
4. Railway will detect the repo — click **Add service** (don't deploy anything yet)

---

## Step 3 — Add PostgreSQL

In your Railway project canvas:
1. Click **+ New** → **Database** → **PostgreSQL**
2. Railway provisions a managed Postgres instance instantly
3. Click it → **Variables** tab — note the `DATABASE_URL` (Railway auto-generates it)

---

## Step 4 — Deploy the Backend

1. Click **+ New** → **GitHub Repo** → select `reelz` → set **Root Directory** to `backend`
2. Railway will find `backend/railway.toml` and use `Dockerfile.prod`
3. Go to **Variables** tab and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Click **+ Reference** → select your Postgres service's `DATABASE_URL` |
| `JWT_SECRET` | A long random string (generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `JWT_REFRESH_SECRET` | Another long random string |
| `TMDB_API_KEY` | Your TMDB API key |
| `NODE_ENV` | `production` |
| `USER_APP_URL` | Leave blank for now — fill in after user-app deploys |
| `ADMIN_APP_URL` | Leave blank for now — fill in after admin-app deploys |

4. Click **Deploy** — Railway will build and run migrations automatically

5. Once deployed, go to **Settings → Networking → Generate Domain** — copy this URL (e.g. `https://reelz-backend-prod.up.railway.app`)

---

## Step 5 — Deploy the User App

1. Click **+ New** → **GitHub Repo** → select `reelz` → set **Root Directory** to `user-app`
2. Go to **Variables** and add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | The backend URL from Step 4 (e.g. `https://reelz-backend-prod.up.railway.app`) |

3. Click **Deploy**
4. After deploy → **Settings → Networking → Generate Domain** — copy the URL

---

## Step 6 — Deploy the Admin App

1. Click **+ New** → **GitHub Repo** → select `reelz` → set **Root Directory** to `admin-app`
2. Go to **Variables** and add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | The backend URL from Step 4 |

3. Click **Deploy**
4. After deploy → **Settings → Networking → Generate Domain** — copy the URL

---

## Step 7 — Wire CORS back to the Backend

Now that you have all three URLs, go back to the **backend service → Variables** and fill in:

| Variable | Value |
|---|---|
| `USER_APP_URL` | The user-app Railway URL from Step 5 |
| `ADMIN_APP_URL` | The admin-app Railway URL from Step 6 |

Railway will auto-redeploy the backend with the updated CORS config.

---

## Step 8 — Seed demo data (optional)

In the Railway dashboard, open the backend service → **Shell** tab:

```bash
node src/scripts/seed.js
```

This creates:
- `admin@reelz.dev` / `admin123`
- `user@reelz.dev` / `user123`

---

## Final checklist

- [ ] PostgreSQL database green
- [ ] Backend healthy (`/health` returns `{"status":"ok"}`)
- [ ] User app loads at its Railway URL
- [ ] Admin app loads at its Railway URL
- [ ] Login works with demo credentials
- [ ] TMDB search works (requires API key)

---

## Cost

Railway's free **Hobby plan** includes $5/month of credit, which comfortably covers:
- 1 Postgres instance (512MB)
- 3 small services

For a class demo this is free or near-free.
