require("dotenv").config();

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const { createClient } = require("redis");
const { Pool }   = require("pg");

const problemsRouter   = require("./routes/problems");
const setupMatchmaking = require("./socket/matchmaking");
const setupRoom        = require("./socket/room");

const app    = express();
const server = http.createServer(app);

// ── Trust Railway / Vercel / any reverse-proxy's forwarded headers ────────────
// Required for correct IP detection and HTTPS detection behind proxies.
app.set("trust proxy", 1);

// ── CORS ──────────────────────────────────────────────────────────────────────
// CLIENT_URL can be a comma-separated list to support multiple origins
// e.g. "https://codemeet.vercel.app,http://localhost:3000"
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin SSR)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: corsOptions,
  // Allow Socket.io v3 clients (allowEIO3) and both transports so Railway's
  // proxy can negotiate websocket after the initial polling handshake.
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

// ── Redis ─────────────────────────────────────────────────────────────────────
const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  // Railway injects TLS Redis URLs — socket.io-redis handles tls:// automatically
  socket: process.env.REDIS_URL?.startsWith("rediss://")
    ? { tls: true, rejectUnauthorized: false }
    : undefined,
});
redis.on("error", (err) => console.error("[Redis] Error:", err));

// ── PostgreSQL ────────────────────────────────────────────────────────────────
const pg = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://codemeet:codemeet@localhost:5432/codemeet",
  // Railway Postgres uses SSL in production
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// ── REST routes ───────────────────────────────────────────────────────────────
app.use("/api/problems", problemsRouter(pg));

// Health check — Railway polls this to confirm the service is up
app.get("/health", (_req, res) => {
  res.json({
    status:  "ok",
    uptime:  Math.floor(process.uptime()),
    env:     process.env.NODE_ENV || "development",
    ts:      new Date().toISOString(),
  });
});

// ── Socket.io connections ─────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id} (transport: ${socket.conn.transport.name})`);

  setupMatchmaking(socket, io, redis, pg);
  setupRoom(socket, io, redis);

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} — ${reason}`);
  });
});

// ── Broadcast live queue size every 3 seconds ─────────────────────────────────
setInterval(async () => {
  try {
    const count = await redis.lLen("codemeet:waiting_queue");
    io.emit("queue_update", { count });
  } catch (err) {
    console.error("[Queue broadcast] Error:", err);
  }
}, 3000);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function start() {
  await redis.connect();
  console.log("[Redis] Connected");

  const client = await pg.connect();
  client.release();
  console.log("[Postgres] Connected");

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] CodeMeet backend running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });
}

start().catch((err) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});
