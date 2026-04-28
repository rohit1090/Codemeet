# CodeMeet — Backend

Real-time collaborative DSA solving backend. Node.js + Express + Socket.io + Redis + PostgreSQL + Judge0.

## Quick start (Docker — recommended)

```bash
cd backend

# 1. Start everything (first run downloads images — may take a few minutes)
docker-compose up --build

# Judge0 needs ~30 s to initialise on first boot.
# The backend is ready when you see:
#   [Server] CodeMeet backend running on port 4000
```

The frontend at `localhost:3000` can now connect.

## Manual start (no Docker)

Prerequisites: Node 18+, Redis, PostgreSQL 14+, Judge0 (optional).

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Create the database
createdb codemeet

# 4. Run schema + seed
psql $DATABASE_URL -f db/schema.sql
psql $DATABASE_URL -f db/seed.sql

# 5. Start Redis (if not already running)
redis-server

# 6. Start the server
npm start          # production
npm run dev        # with nodemon (auto-restart)
```

## Environment variables

| Variable       | Default                                             | Description                  |
|----------------|-----------------------------------------------------|------------------------------|
| `PORT`         | `4000`                                              | HTTP/WS port                 |
| `DATABASE_URL` | `postgresql://codemeet:codemeet@localhost:5432/codemeet` | App database            |
| `REDIS_URL`    | `redis://localhost:6379`                            | Matchmaking queue            |
| `JUDGE0_URL`   | `http://localhost:2358`                             | Code execution engine        |
| `CLIENT_URL`   | `http://localhost:3000`                             | Frontend origin (CORS)       |

## API

| Method | Path                | Description                              |
|--------|---------------------|------------------------------------------|
| GET    | `/health`           | Liveness check                           |
| GET    | `/api/problems`     | List all problems (id, title, difficulty)|
| GET    | `/api/problems/:id` | Full problem (examples, test cases, etc.)|

## Socket.io events

### Client → Server

| Event             | Payload                        | Description                    |
|-------------------|--------------------------------|--------------------------------|
| `find_match`      | —                              | Join matchmaking queue         |
| `cancel_match`    | —                              | Leave matchmaking queue        |
| `code_change`     | `{ roomId, code }`             | Broadcast code to partner      |
| `language_change` | `{ roomId, languageValue }`    | Broadcast language to partner  |
| `send_message`    | `{ roomId, text }`             | Send chat message to partner   |

### Server → Client

| Event             | Payload                                       | Description                         |
|-------------------|-----------------------------------------------|-------------------------------------|
| `match_found`     | `{ roomId, problem, opponentId }`             | Match successful                    |
| `match_error`     | `{ message }`                                 | Matchmaking failure                 |
| `queue_update`    | `{ count }`                                   | Live queue size (every 3 s)         |
| `code_update`     | `{ code }`                                    | Partner's code update               |
| `language_update` | `{ languageValue }`                           | Partner changed language            |
| `receive_message` | `{ text, senderId }`                          | Incoming chat message               |
| `partner_left`    | `{ message }`                                 | Partner disconnected                |

## Judge0 language IDs

These match the frontend's `LANGUAGES` map in `EditorRoom.jsx`.

| Language   | Judge0 ID |
|------------|-----------|
| Python     | 71        |
| JavaScript | 63        |
| Java       | 62        |
| C++        | 54        |
| Go         | 60        |

## Redis key schema

| Key                       | Type   | TTL     | Value                              |
|---------------------------|--------|---------|------------------------------------|
| `codemeet:waiting_queue`  | List   | none    | Socket IDs waiting for a match     |
| `room:{roomId}`           | String | 2 hours | `{ users: [id1, id2], problemId }` |
| `socket:{socketId}`       | String | 2 hours | `roomId` this socket is in         |
