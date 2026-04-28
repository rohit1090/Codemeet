# CodeMeet

> Like Omegle — but for coding interviews.

Randomly match with another developer and solve DSA problems together in real-time. Shared Monaco editor, live chat, and instant code execution across 5 languages.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│   React SPA (Vercel)                                         │
│   Landing → WaitingRoom → EditorRoom                         │
│        │ Socket.io (WS/polling)    │ REST (axios)            │
└────────┼──────────────────────────┼──────────────────────────┘
         │                          │
         ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│           Node.js + Express + Socket.io  (Railway)           │
│                                                              │
│  /api/problems ──────────────────────────► PostgreSQL        │
│  Socket events ──► matchmaking queue ────► Redis             │
│                    room code/chat sync                       │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Judge0              │
│  (Railway /          │
│   self-hosted)       │
│  Code execution      │
└──────────────────────┘
```

---

## Tech Stack

| Layer        | Technology                                |
|--------------|-------------------------------------------|
| Frontend     | React 18, Monaco Editor, Socket.io-client |
| Backend      | Node.js 18, Express, Socket.io            |
| Database     | PostgreSQL 16                             |
| Cache/Queue  | Redis 7                                   |
| Code runner  | Judge0                                    |
| Frontend host| Vercel                                    |
| Backend host | Railway                                   |
| CI/CD        | GitHub Actions                            |

---

## Local Development

### Prerequisites

- Docker Desktop (for the backend stack)
- Node.js 18+

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/codemeet.git
cd codemeet
npm install                          # frontend deps
cd backend && npm install && cd ..   # backend deps
```

### 2. Start the backend stack

```bash
cd backend
docker-compose up --build
```

Services started:
| Service      | Port  | Notes                              |
|--------------|-------|------------------------------------|
| backend      | 4000  | Node.js API + Socket.io            |
| postgres     | 5432  | Schema + seed applied automatically|
| redis        | 6379  | Matchmaking queue                  |
| judge0       | 2358  | Takes ~30 s to initialise          |

### 3. Start the frontend

```bash
# In the project root (new terminal)
npm start
```

Open `http://localhost:3000`. Open a **second tab** and click **Find a Match** in both — they pair instantly and share the same editor.

### App only (no local Judge0)

```bash
cd backend
docker-compose up backend postgres redis
```

Set `REACT_APP_JUDGE0_URL` in `.env` to point at a hosted Judge0 instance.

---

## Environment Variables

### Frontend (`.env` in project root)

| Variable                | Example                           | Description              |
|-------------------------|-----------------------------------|--------------------------|
| `REACT_APP_BACKEND_URL` | `https://codemeet.up.railway.app` | Backend + Socket.io host |
| `REACT_APP_JUDGE0_URL`  | `https://judge0.up.railway.app`   | Judge0 execution host    |

### Backend (`backend/.env`)

| Variable       | Example                                             | Description            |
|----------------|-----------------------------------------------------|------------------------|
| `PORT`         | `4000`                                              | HTTP port              |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/codemeet`         | PostgreSQL connection  |
| `REDIS_URL`    | `redis://default:pass@host:6379`                    | Redis connection       |
| `JUDGE0_URL`   | `https://judge0.up.railway.app`                     | Judge0 base URL        |
| `CLIENT_URL`   | `https://codemeet.vercel.app,http://localhost:3000` | CORS allowed origins   |
| `NODE_ENV`     | `production`                                        | Runtime environment    |

---

## API Reference

| Method | Path                | Description                                      |
|--------|---------------------|--------------------------------------------------|
| GET    | `/health`           | Liveness — returns `{ status, uptime, env, ts }` |
| GET    | `/api/problems`     | List all problems `[{ id, title, difficulty }]`  |
| GET    | `/api/problems/:id` | Full problem with examples, test cases, starter code |

---

## Socket.io Events

### Client → Server

| Event             | Payload                     | Description                 |
|-------------------|-----------------------------|-----------------------------|
| `find_match`      | —                           | Join matchmaking queue      |
| `cancel_match`    | —                           | Leave queue                 |
| `code_change`     | `{ roomId, code }`          | Sync code to partner        |
| `language_change` | `{ roomId, languageValue }` | Sync language to partner    |
| `send_message`    | `{ roomId, text }`          | Send chat message           |

### Server → Client

| Event             | Payload                           | Description                   |
|-------------------|-----------------------------------|-------------------------------|
| `match_found`     | `{ roomId, problem, opponentId }` | Match successful              |
| `match_error`     | `{ message }`                     | Matchmaking failure           |
| `queue_update`    | `{ count }`                       | Live queue size (every 3 s)   |
| `code_update`     | `{ code }`                        | Partner's code update         |
| `language_update` | `{ languageValue }`               | Partner changed language      |
| `receive_message` | `{ text, senderId }`              | Incoming chat message         |
| `partner_left`    | `{ message }`                     | Partner disconnected          |

---

## Project Structure

```
codemeet/
├── src/                         # React frontend
│   ├── App.jsx                  # Root — screen state + socket cleanup
│   ├── Landing.jsx              # Homepage
│   ├── WaitingRoom.jsx          # Matchmaking + socket creation
│   ├── EditorRoom.jsx           # Coding session (editor + chat + problem)
│   ├── ChatPanel.jsx
│   ├── ProblemPanel.jsx
│   ├── ResultPanel.jsx
│   ├── hooks/
│   │   ├── useSocket.js         # Standalone socket hook
│   │   └── useCodeSync.js       # Debounced code sync + language sync
│   └── api/
│       └── problems.js          # Axios REST client
├── backend/
│   ├── server.js                # Express + Socket.io entry point
│   ├── socket/
│   │   ├── matchmaking.js       # Queue + pairing (Redis)
│   │   └── room.js              # Code/chat relay + disconnect cleanup
│   ├── routes/
│   │   └── problems.js          # REST endpoints
│   ├── db/
│   │   ├── schema.sql           # Table definitions
│   │   └── seed.sql             # 10 DSA problems
│   ├── Dockerfile               # Production image
│   ├── docker-compose.yml       # Local + prod profiles
│   ├── railway.toml             # Railway deployment config
│   └── judge0.conf              # Judge0 container config
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD — build + deploy on push to main
├── vercel.json                  # Vercel SPA config + security headers
├── .gitignore
└── DEPLOYMENT.md                # Step-by-step production deployment guide
```

---

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the complete guide.

Quick summary:
1. Push repo to GitHub
2. Connect project root to **Vercel** → set env vars → deploy
3. Connect `backend/` to **Railway** → add Redis + Postgres plugins → set env vars → deploy
4. Add `VERCEL_TOKEN` + `RAILWAY_TOKEN` to GitHub Secrets
5. Every push to `main` triggers automatic deployment via GitHub Actions
