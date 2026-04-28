# CodeMeet — Production Deployment Guide

This guide deploys:
- **Frontend** → Vercel (free tier)
- **Backend** → Railway (Hobby $5/month)
- **PostgreSQL** → Railway plugin (included)
- **Redis** → Railway plugin (included)
- **Judge0** → Railway service (optional — can use a public instance)

---

## Prerequisites

```bash
# Install CLIs
npm install -g vercel@latest
npm install -g @railway/cli

# Verify
vercel --version
railway --version
```

---

## Step 1 — Push to GitHub

```bash
cd codemeet

git init
git add .
git commit -m "initial commit"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/codemeet.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Railway

### 2a. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select your `codemeet` repo
3. When asked which directory, set the **Root Directory** to `backend`
4. Railway detects the `Dockerfile` automatically

### 2b. Add Redis plugin

In your Railway project dashboard:
1. Click **+ New** → **Database** → **Add Redis**
2. Railway automatically injects `REDIS_URL` into your backend service

### 2c. Add PostgreSQL plugin

1. Click **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically injects `DATABASE_URL` into your backend service

### 2d. Run database migrations

Open a Railway shell or use the CLI:

```bash
# Connect to your Railway project
railway login
railway link   # select your project when prompted

# Run schema + seed against Railway's Postgres
railway run psql $DATABASE_URL -f backend/db/schema.sql
railway run psql $DATABASE_URL -f backend/db/seed.sql
```

Alternatively, in the Railway dashboard → your Postgres service → **Query** tab, paste and run the contents of `schema.sql` then `seed.sql`.

### 2e. Set environment variables on Railway

In the Railway dashboard → your backend service → **Variables**, add:

| Variable     | Value                                      |
|--------------|--------------------------------------------|
| `NODE_ENV`   | `production`                               |
| `JUDGE0_URL` | `https://YOUR_JUDGE0_SERVICE.up.railway.app` *(or public instance — see Step 4)* |
| `CLIENT_URL` | `https://YOUR_APP.vercel.app,http://localhost:3000` *(fill Vercel URL after Step 3)* |

`DATABASE_URL`, `REDIS_URL`, and `PORT` are injected automatically by Railway.

### 2f. Note your backend URL

In the Railway dashboard → your backend service → **Settings** → **Networking**, generate a public domain. It looks like:

```
https://codemeet-backend-production.up.railway.app
```

Save this — you need it for the Vercel env vars.

### 2g. Verify backend is up

```bash
curl https://YOUR_BACKEND.up.railway.app/health
# Expected: {"status":"ok","uptime":42,"env":"production","ts":"..."}
```

---

## Step 3 — Deploy Frontend on Vercel

### 3a. Create Vercel project

```bash
cd codemeet   # project root, NOT backend/

vercel         # follow the prompts
# Framework: Create React App
# Root directory: ./  (default)
# Build command: npm run build  (default)
# Output directory: build  (default)
```

Or use the Vercel dashboard: **New Project** → import from GitHub → select `codemeet` repo.

### 3b. Set environment variables on Vercel

In the Vercel dashboard → your project → **Settings** → **Environment Variables**, add:

| Variable                | Value                                         | Environments         |
|-------------------------|-----------------------------------------------|----------------------|
| `REACT_APP_BACKEND_URL` | `https://YOUR_BACKEND.up.railway.app`         | Production, Preview  |
| `REACT_APP_JUDGE0_URL`  | `https://YOUR_JUDGE0.up.railway.app`          | Production, Preview  |

### 3c. Redeploy to pick up env vars

```bash
vercel --prod
```

Or push any commit to `main` — Vercel rebuilds automatically.

### 3d. Note your frontend URL

```
https://codemeet.vercel.app
```

### 3e. Update Railway CLIENT_URL

Go back to Railway → backend service → **Variables** → update `CLIENT_URL`:

```
https://codemeet.vercel.app,http://localhost:3000
```

Redeploy the Railway service (it auto-redeploys on variable change).

---

## Step 4 — Judge0 (Code Execution)

### Option A — Deploy Judge0 on Railway (recommended)

1. In your Railway project → **+ New** → **Empty Service**
2. Name it `judge0`
3. Add a `judge0-redis` Redis plugin and a `judge0-db` Postgres plugin for Judge0's own use
4. In the service settings → **Source** → connect the `judge0/judge0` Docker image
5. Add these variables to the judge0 service:

   | Variable          | Value                          |
   |-------------------|--------------------------------|
   | `REDIS_URL`       | *(Judge0's own Redis URL)*     |
   | `POSTGRES_HOST`   | *(Judge0's own PG host)*       |
   | `POSTGRES_DB`     | `judge0`                       |
   | `POSTGRES_USER`   | `judge0`                       |
   | `POSTGRES_PASSWORD` | *(Judge0's own PG password)* |
   | `ALLOW_ORIGIN`    | `*`                            |

6. After deploy, set `JUDGE0_URL` on your backend to the Judge0 Railway URL.

### Option B — Use the public Judge0 CE API (free, rate-limited)

> ⚠️  Not suitable for production load, but fine for demos.

Set both on Vercel and Railway:
```
REACT_APP_JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
```

You'll also need to add a `X-RapidAPI-Key` header — update `EditorRoom.jsx` `fetch` calls accordingly.

---

## Step 5 — Set up GitHub Actions (CI/CD)

### 5a. Get tokens

**Vercel token:**
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a token named `github-actions`
3. Copy the value

**Railway token:**
1. Go to your Railway project → **Settings** → **Tokens**
2. Create a token named `github-actions`
3. Copy the value

**Link Vercel project locally** (one-time):

```bash
cd codemeet
vercel link   # links .vercel/project.json — commit this file
```

### 5b. Add secrets to GitHub

Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name     | Value                    |
|-----------------|--------------------------|
| `VERCEL_TOKEN`  | *(Vercel token)*         |
| `RAILWAY_TOKEN` | *(Railway project token)*|

### 5c. Test the pipeline

```bash
git add .
git commit -m "add deployment config"
git push origin main
```

Go to GitHub → **Actions** tab — you should see:
1. ✅ Build Frontend
2. ✅ Deploy Frontend → Vercel
3. ✅ Deploy Backend → Railway

---

## Verification Checklist

```bash
# 1. Backend health
curl https://YOUR_BACKEND.up.railway.app/health

# 2. Problems API
curl https://YOUR_BACKEND.up.railway.app/api/problems

# 3. Frontend loads
open https://YOUR_APP.vercel.app

# 4. End-to-end test
# Open two browser tabs at your Vercel URL
# Click "Find a Match" in both tabs
# → They should pair and land in the editor
# → Type in one tab — appears in the other within 50 ms
# → Send a chat message — appears instantly
# → Click Run — Judge0 executes and shows results
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Socket.io connection fails | `CLIENT_URL` missing the Vercel domain | Update `CLIENT_URL` on Railway to include your Vercel URL |
| WebSocket upgrade fails | Railway proxy stripping WS headers | Already handled: client uses `["websocket","polling"]` with `allowEIO3:true` |
| `DATABASE_URL` SSL error | Railway Postgres requires SSL | Already handled: `ssl: { rejectUnauthorized: false }` in server.js |
| Problems not loading | Schema/seed not run | Re-run `railway run psql $DATABASE_URL -f backend/db/schema.sql` |
| Judge0 returns 401 | Missing auth headers | Use a self-hosted instance or add RapidAPI key |
| Build fails in CI | Missing env var | Add `REACT_APP_BACKEND_URL` / `REACT_APP_JUDGE0_URL` to Vercel env vars |

---

## Useful Commands

```bash
# View Railway logs live
railway logs --tail

# Open Railway shell
railway shell

# Redeploy backend manually
cd backend && railway up --service codemeet-backend

# Redeploy frontend manually
vercel --prod

# Check Redis queue size
railway run redis-cli -u $REDIS_URL LLEN codemeet:waiting_queue
```
