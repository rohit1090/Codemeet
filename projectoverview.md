# CodeMeet — Full Technical Project Overview

> "Like Omegle, but for coding interviews."  
> Real-time collaborative DSA solving platform. Two users are randomly matched, given the same problem, and solve it together in a shared Monaco editor with live chat and code execution.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend (React SPA)](#4-frontend-react-spa)
5. [Backend (Node.js / Express)](#5-backend-nodejs--express)
6. [Database (PostgreSQL)](#6-database-postgresql)
7. [Real-time Layer (Socket.io + Redis)](#7-real-time-layer-socketio--redis)
8. [Authentication (Google OAuth2 + JWT)](#8-authentication-google-oauth2--jwt)
9. [Code Execution (Judge0)](#9-code-execution-judge0)
10. [API Reference](#10-api-reference)
11. [Socket.io Event Reference](#11-socketio-event-reference)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)
14. [Guest Limit & Monetisation Hook](#14-guest-limit--monetisation-hook)
15. [Data Flow Diagrams](#15-data-flow-diagrams)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│   React SPA (Vercel)                                            │
│   ┌───────────┐  ┌─────────────┐  ┌────────────┐               │
│   │  Landing  │  │ WaitingRoom │  │ EditorRoom │               │
│   │  Page     │  │ (Socket.io) │  │ (Monaco +  │               │
│   │           │  │             │  │  Chat)     │               │
│   └───────────┘  └─────────────┘  └────────────┘               │
│         │               │                │                      │
│    REST (axios)    WebSocket (ws)    WebSocket (ws)             │
└─────────┼───────────────┼────────────────┼─────────────────────┘
          │               │                │
          ▼               ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Node.js / Express Backend (Railway)                │
│                                                                 │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ REST Routes  │  │  Socket.io      │  │  Passport.js    │    │
│  │ /api/problems│  │  Matchmaking    │  │  Google OAuth2  │    │
│  │ /auth/*      │  │  Room Sync      │  │  JWT Issue      │    │
│  └──────┬───────┘  └────────┬────────┘  └────────┬────────┘    │
│         │                   │                    │              │
└─────────┼───────────────────┼────────────────────┼─────────────┘
          │                   │                    │
          ▼                   ▼                    │
┌──────────────────┐  ┌──────────────────┐         │
│   PostgreSQL     │  │     Redis        │         │
│   (Railway)      │  │     (Railway)    │         │
│                  │  │                  │         │
│  problems (10)   │  │  waiting_queue   │         │
│  users           │  │  room:roomId     │         │
│                  │  │  socket:socketId │         │
└──────────────────┘  └──────────────────┘         │
                                                    ▼
                                          ┌──────────────────┐
                                          │   Google OAuth   │
                                          │   (accounts.     │
                                          │    google.com)   │
                                          └──────────────────┘
```

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Create React App | 5 | Build toolchain |
| @monaco-editor/react | latest | Code editor (VS Code engine) |
| socket.io-client | 4.x | WebSocket client |
| axios | 1.x | HTTP client for REST calls |
| Google Fonts (Inter + Manrope + JetBrains Mono) | — | Typography |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.18 | HTTP server |
| Socket.io | 4.7 | WebSocket server |
| Passport.js | 0.7 | OAuth middleware |
| passport-google-oauth20 | 2.0 | Google OAuth2 strategy |
| jsonwebtoken | 9.0 | JWT sign/verify |
| express-session | 1.19 | Session store for OAuth dance |
| pg (node-postgres) | 8.11 | PostgreSQL client |
| redis | 4.6 | Redis client |
| uuid | 9.0 | Room ID generation |
| dotenv | 16 | Environment variables |

### Infrastructure
| Service | Platform | Purpose |
|---|---|---|
| Frontend hosting | Vercel | Static SPA deployment |
| Backend hosting | Railway | Node.js server + auto-deploy |
| PostgreSQL | Railway plugin | Persistent data store |
| Redis | Railway plugin | Matchmaking queue + room state |
| Domain (frontend) | `codemeet-app.vercel.app` | Live URL |
| Domain (backend) | `codemeet-production.up.railway.app` | API + Socket |

---

## 3. Project Structure

```
CodeMeet/
├── src/                          # React frontend
│   ├── index.js                  # Entry point, wraps app in <AuthProvider>
│   ├── App.jsx                   # Root: screen state machine, OAuth callback handler
│   ├── global.css                # CSS variables, fonts, base reset
│   │
│   ├── Landing.jsx               # Homepage: hero, features, stats, nav
│   ├── Landing.css
│   ├── WaitingRoom.jsx           # Matchmaking screen: creates socket, waits for match_found
│   ├── EditorRoom.jsx            # 3-panel editor: problem | Monaco | chat
│   ├── EditorRoom.css
│   ├── ProblemsPage.jsx          # Browse all problems with difficulty filter
│   ├── ProblemsPage.css
│   ├── LoginPromptModal.jsx      # Guest-limit popup (after 5 free matches)
│   ├── LoginPromptModal.css
│   │
│   ├── ProblemPanel.jsx          # Left panel: problem description, examples
│   ├── ChatPanel.jsx             # Right panel: real-time chat
│   ├── ResultPanel.jsx           # Left panel (results tab): run/submit output
│   ├── components.css            # Shared panel styles
│   │
│   ├── context/
│   │   └── AuthContext.jsx       # Global auth state: user, login(), logout(), getToken()
│   │
│   ├── hooks/
│   │   ├── useSocket.js          # (utility) standalone socket hook
│   │   └── useCodeSync.js        # Real-time code sync: emit debounced, receive+apply
│   │
│   └── api/
│       └── problems.js           # Axios: getProblems(), getProblem(id)
│
├── backend/
│   ├── server.js                 # Express app, Socket.io, Redis/PG init, bootstrap
│   ├── package.json
│   ├── Dockerfile
│   ├── railway.toml              # Healthcheck config
│   │
│   ├── config/
│   │   └── passport.js           # Google OAuth2 strategy, upsert user to DB
│   │
│   ├── routes/
│   │   ├── problems.js           # GET /api/problems, GET /api/problems/:id
│   │   └── auth.js               # GET /auth/google, /auth/google/callback, /auth/me
│   │
│   ├── socket/
│   │   ├── matchmaking.js        # find_match, cancel_match — Redis queue, random problem
│   │   └── room.js               # code_change, language_change, send_message, disconnect
│   │
│   └── db/
│       ├── schema.sql            # CREATE TABLE problems, users
│       └── seed.sql              # 10 DSA problems with starter code for all 4 languages
│
├── vercel.json                   # CRA build config, SPA rewrites, security headers
├── .github/workflows/deploy.yml  # CI/CD pipeline
└── projectoverview.md            # This file
```

---

## 4. Frontend (React SPA)

### Screen State Machine (App.jsx)

The app uses **state-based routing** (no React Router). A single `screen` state controls what renders:

```
"landing" → "waiting" → "editor"
    ↑            |           |
    └────────────┴───────────┘  (onCancel / onLeave)
    
"landing" → "problems" → back to "landing"
```

**State transitions:**
- `handleFindMatch()` — checks guest limit → `"waiting"` (or shows LoginPromptModal)
- `handleMatchFound(data)` — stores socket ref → `"editor"`
- `handleLeave()` — disconnects socket → `"landing"` (shows LoginPromptModal if limit hit)

### Socket Lifecycle

```
WaitingRoom mounts
    └── creates new socket (io(BACKEND_URL))
    └── emits "find_match"
    └── on "match_found" → calls onMatchFound({ roomId, problem, socket })
                          → matchedRef = true (prevents cleanup from disconnecting)

App.jsx stores socket in socketRef

EditorRoom uses the socket from matchData
    └── useCodeSync hook listens for "code_update", "language_update"
    └── listens for "partner_left"

handleLeave() in App.jsx
    └── socketRef.current.disconnect()
    └── socketRef.current = null
```

### AuthContext (src/context/AuthContext.jsx)

Provides global auth state via React Context:

```js
const { user, loading, login, logout, getToken } = useAuth();
```

- **`user`** — decoded JWT payload: `{ id, email, display_name, avatar_url }`
- **`login(token)`** — stores token in `localStorage`, decodes payload into `user`
- **`logout()`** — removes token, clears `user`
- **`getToken()`** — returns raw JWT for Authorization headers
- Token expiry checked on mount (7-day tokens)

### Guest Match Limit (App.jsx)

```
localStorage key: "codemeet_guest_matches"  (integer, default 0)
GUEST_MATCH_LIMIT = 5

handleFindMatch():
  if (user) → proceed
  if (guestCount >= 5) → show LoginPromptModal
  else → proceed to waiting

handleMatchFound():
  if (!user) → increment counter

handleLeave():
  if (!user && count >= 5) → show LoginPromptModal automatically
```

### useCodeSync Hook

Prevents echo (user's own edits re-emitting) using a `suppressRef`:

```
Partner types → server emits "code_update" to this client
→ suppressRef = true
→ editor.setValue(code)          ← direct model update (no onChange fire... but just in case)
→ suppressRef = false

Local user types → onChange fires → syncCode(code)
→ if suppressRef === true: return  ← prevents echo
→ debounce 50ms → emit "code_change" to server
```

Cursor position is saved and restored around `model.setValue()` so the user's cursor doesn't jump when partner edits arrive.

### Typography System

| Variable | Font | Used For |
|---|---|---|
| `--font-display` | Manrope 400–800 | Headings, logo, buttons, stats |
| `--font-body` | Inter 400–800 | Body text, nav links, descriptions |
| `--font-code` | JetBrains Mono | Monaco editor, code badges |

---

## 5. Backend (Node.js / Express)

### server.js Bootstrap Sequence

```
1. Load .env
2. Create Express app + HTTP server
3. Set trust proxy = 1  (Railway reverse proxy)
4. Configure CORS (CLIENT_URL env var, comma-separated origins)
5. Mount express-session + passport.initialize() + passport.session()
6. Mount REST routes: /api/problems, /auth
7. Create Socket.io server (allowEIO3, websocket+polling transports)
8. Create Redis client + connect
9. Create PostgreSQL pool
10. Mount socket handlers: matchmaking + room per connection
11. Start queue-size broadcaster (every 3s via Redis LLEN)
12. Listen on process.env.PORT || 4000
```

### CORS Configuration

```js
const allowedOrigins = process.env.CLIENT_URL.split(",").map(o => o.trim());
// e.g. "https://codemeet-app.vercel.app,http://localhost:3000"
```

Credentials are allowed (`credentials: true`) for cookie/session support during OAuth.

### Middleware Stack (in order)

1. `trust proxy` — for correct IP/HTTPS behind Railway's proxy
2. `cors(corsOptions)` — multi-origin CORS
3. `express.json()` — JSON body parsing
4. `express-session` — in-memory session (used only during OAuth redirect dance)
5. `passport.initialize()` + `passport.session()` — OAuth state management

---

## 6. Database (PostgreSQL)

### Schema

```sql
-- problems table
CREATE TABLE problems (
  id           SERIAL       PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  difficulty   VARCHAR(10)  NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  description  TEXT         NOT NULL,
  examples     JSONB        NOT NULL DEFAULT '[]',   -- [{input, output, explanation?}]
  constraints  JSONB        NOT NULL DEFAULT '[]',   -- ["string", ...]
  test_cases   JSONB        NOT NULL DEFAULT '[]',   -- [{input (stdin), output (stdout)}]
  starter_code JSONB        NOT NULL DEFAULT '{}',   -- {python, javascript, java, cpp}
  created_at   TIMESTAMP    DEFAULT NOW()
);

-- users table
CREATE TABLE users (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username     VARCHAR(100) UNIQUE,
  created_at   TIMESTAMP    DEFAULT NOW(),
  google_id    VARCHAR(100) UNIQUE,
  email        VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  avatar_url   TEXT
);
```

### Seeded Problems (10 total)

| # | Title | Difficulty |
|---|-------|-----------|
| 1 | Two Sum | Easy |
| 2 | Valid Parentheses | Easy |
| 3 | Reverse Linked List | Easy |
| 4 | Maximum Subarray | Medium |
| 5 | Climbing Stairs | Easy |
| 6 | Best Time to Buy and Sell Stock | Easy |
| 7 | Palindrome Number | Easy |
| 8 | Merge Two Sorted Lists | Easy |
| 9 | Contains Duplicate | Easy |
| 10 | Roman to Integer | Easy |

Each problem has starter code templates for **Python, JavaScript, Java, C++** that read from stdin so Judge0 can execute them directly.

---

## 7. Real-time Layer (Socket.io + Redis)

### Redis Data Model

```
codemeet:waiting_queue     LIST   [socketId, socketId, ...]   LPUSH to add, RPOP to match
room:{roomId}              STRING JSON { users: [socketId, socketId], problemId: number }  TTL 2h
socket:{socketId}          STRING roomId   TTL 2h
```

### Matchmaking Flow (matchmaking.js)

```
Client emits "find_match"
↓
RPOP codemeet:waiting_queue
↓
If nobody waiting:
  LPUSH self → wait
If partner found but socket gone (stale):
  LPUSH self → wait
If partner found and connected:
  generate roomId (UUID v4)
  SELECT * FROM problems ORDER BY RANDOM() LIMIT 1
  SETEX room:{roomId}, socket:{self}, socket:{partner}
  socket.join(roomId), partnerSocket.join(roomId)
  emit "match_found" to both with { roomId, problem, opponentId }
```

### Room Sync Events (room.js)

| Client emits | Server does |
|---|---|
| `code_change { roomId, code }` | `socket.to(roomId).emit("code_update", { code })` |
| `language_change { roomId, languageValue }` | `socket.to(roomId).emit("language_update", { languageValue })` |
| `send_message { roomId, text }` | `socket.to(roomId).emit("receive_message", { text, senderId })` |
| `disconnect` | Looks up room via Redis, emits `partner_left` to partner, deletes Redis keys |

### Queue Size Broadcast

Every 3 seconds the server does `LLEN codemeet:waiting_queue` and emits `queue_update { count }` to all connected clients (used for live "Online Now" stats on the landing page).

---

## 8. Authentication (Google OAuth2 + JWT)

### Full OAuth Flow

```
1. User clicks "Log in with Google" → browser navigates to:
   GET https://codemeet-production.up.railway.app/auth/google

2. Passport redirects to:
   https://accounts.google.com/o/oauth2/auth?...&scope=profile+email

3. User approves → Google redirects to:
   GET https://codemeet-production.up.railway.app/auth/google/callback?code=...

4. Passport exchanges code → gets profile (id, email, displayName, photo)

5. Backend upserts user into PostgreSQL:
   INSERT INTO users (google_id, email, display_name, avatar_url)
   ON CONFLICT (google_id) DO UPDATE SET ...

6. Backend signs JWT (7-day expiry):
   payload: { id, email, display_name, avatar_url }

7. Backend redirects to:
   https://codemeet-app.vercel.app/auth/callback?token=JWT

8. React App.jsx detects /auth/callback pathname on mount:
   - Extracts token from URL params
   - Calls login(token) → stores in localStorage, decodes payload into user state
   - Cleans URL with history.replaceState

9. User is now logged in. Avatar + name shown in navbar.
```

### JWT Structure

```json
{
  "id": "uuid-v4",
  "email": "user@gmail.com",
  "display_name": "John Doe",
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "iat": 1714000000,
  "exp": 1714604800
}
```

### Protected Endpoint

```
GET /auth/me
Authorization: Bearer <JWT>

Response: decoded user object
```

---

## 9. Code Execution (Judge0)

### Language ID Mapping

| Language | Judge0 ID |
|---|---|
| Python 3 | 71 |
| JavaScript (Node.js) | 63 |
| Java | 62 |
| C++ (GCC) | 54 |
| Go | 60 |

### Submission Flow

```
POST ${JUDGE0_URL}/submissions?base64_encoded=true&wait=true
Body: {
  language_id: number,
  source_code: base64(code),
  stdin: base64(testCase.input)
}

Response: {
  stdout: base64(output),
  stderr: base64(errors) | null,
  status: { id, description },
  time: "0.05",   // seconds
  memory: 1024    // KB
}
```

**Run** — executes against the first test case only (fast feedback).  
**Submit** — executes against ALL test cases via `Promise.all()`, reports pass/fail per case.

All code and stdin are base64-encoded to safely handle Unicode, newlines, and special characters.

---

## 10. API Reference

### Problems

| Method | Endpoint | Description | Response |
|---|---|---|---|
| GET | `/api/problems` | List all problems | `[{id, title, difficulty}]` |
| GET | `/api/problems/:id` | Full problem detail | `{id, title, difficulty, description, examples, constraints, test_cases, starter_code}` |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/google` | Initiate Google OAuth (redirect) |
| GET | `/auth/google/callback` | OAuth callback → issues JWT → redirects to frontend |
| GET | `/auth/me` | Validate Bearer JWT, return user payload |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | `{status: "ok", uptime, env, ts}` |

---

## 11. Socket.io Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `find_match` | — | Join matchmaking queue |
| `cancel_match` | — | Leave matchmaking queue |
| `code_change` | `{ roomId, code }` | Broadcast code to partner |
| `language_change` | `{ roomId, languageValue }` | Broadcast language switch |
| `send_message` | `{ roomId, text }` | Send chat message |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `match_found` | `{ roomId, problem, opponentId }` | Match paired, start session |
| `match_error` | `{ message }` | Matchmaking failed |
| `code_update` | `{ code }` | Partner's latest code |
| `language_update` | `{ languageValue }` | Partner switched language |
| `receive_message` | `{ text, senderId }` | Partner's chat message |
| `partner_left` | `{ message }` | Partner disconnected |
| `queue_update` | `{ count }` | Live waiting queue size |

---

## 12. Environment Variables

### Backend (Railway)

| Variable | Example | Required | Description |
|---|---|---|---|
| `PORT` | `4000` | Auto-set | Server port |
| `NODE_ENV` | `production` | Yes | Enables SSL, secure cookies |
| `DATABASE_URL` | `postgresql://...` | Yes | Railway Postgres connection string |
| `REDIS_URL` | `redis://...` | Yes | Railway Redis connection string |
| `CLIENT_URL` | `https://codemeet-app.vercel.app` | Yes | CORS allowed origins (comma-separated) |
| `GOOGLE_CLIENT_ID` | `106066...apps.googleusercontent.com` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Yes | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | `https://...railway.app/auth/google/callback` | Yes | OAuth redirect URI |
| `JWT_SECRET` | `random-string-min-32-chars` | Yes | JWT signing secret |
| `SESSION_SECRET` | `random-string-min-32-chars` | Yes | Express session secret |

### Frontend (Vercel)

| Variable | Example | Description |
|---|---|---|
| `REACT_APP_BACKEND_URL` | `https://codemeet-production.up.railway.app` | Backend base URL |
| `REACT_APP_JUDGE0_URL` | `https://judge0-ce.p.rapidapi.com` | Judge0 API base URL |

---

## 13. Deployment

### Frontend — Vercel

- **Build command:** `npm run build`
- **Output directory:** `build`
- **Framework:** Create React App
- **Rewrites:** All routes → `/index.html` (SPA routing)
- **Security headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Auto-deploy:** On every push to `main` branch of `rohit1090/Codemeet`

### Backend — Railway

- **Runtime:** Node.js (Dockerfile)
- **Health check:** `GET /health` → `{ status: "ok" }`
- **Restart policy:** `ON_FAILURE`
- **Services:** Codemeet app + PostgreSQL plugin + Redis plugin
- **SSL:** PostgreSQL uses `{ rejectUnauthorized: false }` in production
- **Trust proxy:** Enabled for Railway's reverse proxy

### CI/CD (GitHub Actions — `.github/workflows/deploy.yml`)

```
Push to main
  └── build-frontend (npm ci + npm run build)
      ├── deploy-frontend → Vercel CLI
      └── deploy-backend  → Railway CLI
```

---

## 14. Guest Limit & Monetisation Hook

Non-authenticated users get **5 free matches**. The counter is stored in `localStorage` under `codemeet_guest_matches`.

**Trigger points:**
1. Clicking "Find a Match" when `count >= 5` → modal shown immediately (blocked)
2. Leaving the editor when `count >= 5` → modal shown after session ends

**LoginPromptModal** offers:
- "Continue with Google" → `/auth/google`
- "Maybe later" → dismisses
- Perks listed: unlimited matches, match history, track progress

**Reset (for testing):** Open DevTools → Application → Local Storage → delete `codemeet_guest_matches`.

---

## 15. Data Flow Diagrams

### Matchmaking

```
Tab 1                    Backend                   Tab 2
  |                         |                        |
  |── find_match ──────────►|                        |
  |                    LPUSH queue                   |
  |                         |                        |
  |                         |◄── find_match ─────────|
  |                    RPOP queue → Tab 1's socketId |
  |                    Verify Tab 1 still connected  |
  |                    Generate roomId (UUID)         |
  |                    SELECT random problem          |
  |                    SETEX room:roomId              |
  |                    SETEX socket:Tab1              |
  |                    SETEX socket:Tab2              |
  |◄── match_found ─────────|──── match_found ───────►|
  |    {roomId, problem}     |    {roomId, problem}    |
```

### Code Sync

```
User types in Monaco
  → onChange(newCode)
  → setCode(newCode)          ← local state
  → syncCode(newCode)
      → suppressRef? return
      → clearTimeout + setTimeout(50ms)
          → socket.emit("code_change", { roomId, code })
                              |
                     socket.to(roomId).emit("code_update", { code })
                              |
          Partner receives "code_update"
              → suppressRef = true
              → editor.getPosition() → save cursor
              → model.setValue(code)
              → suppressRef = false
              → editor.setPosition(cursor) → restore
```

### Google OAuth

```
Browser                    Backend                   Google
  |                           |                        |
  |── click "Login" ─────────►|                        |
  |   (link to /auth/google)  |                        |
  |                    passport.authenticate()         |
  |◄── 302 redirect ──────────|                        |
  |                           |                        |
  |────────────────────────────────────────────────────►|
  |         accounts.google.com/o/oauth2/auth           |
  |◄────────────────────────────────────────────────────|
  |         user picks account, grants permission       |
  |                           |                        |
  |── GET /auth/google/callback?code=... ─────────────►|
  |                    exchange code for profile        |
  |                    upsert user in Postgres          |
  |                    sign JWT (7d)                    |
  |◄── 302 redirect to /auth/callback?token=JWT ───────|
  |                           |                        |
  |  React App.jsx detects /auth/callback              |
  |  login(token) → localStorage + user state          |
  |  history.replaceState("/")                         |
  |  Navbar shows avatar + name                        |
```

---

*Last updated: April 2026*  
*GitHub: `rohit1090/Codemeet`*  
*Live: `https://codemeet-app.vercel.app`*  
*Backend: `https://codemeet-production.up.railway.app`*
