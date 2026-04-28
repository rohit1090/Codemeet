const { v4: uuidv4 } = require("uuid");

const QUEUES = {
  easy:   "codemeet:queue:easy",
  medium: "codemeet:queue:medium",
  hard:   "codemeet:queue:hard",
  random: "codemeet:queue:random",
};
const VALID_DIFF = Object.keys(QUEUES);
const ROOM_TTL   = 7200;

async function fetchElo(socket, pg) {
  if (!socket?.user?.id || !pg) return 1200;
  try {
    const { rows } = await pg.query("SELECT elo FROM users WHERE id = $1", [socket.user.id]);
    return rows[0]?.elo ?? 1200;
  } catch {
    return 1200;
  }
}

async function removeFromAllQueues(redis, socketId) {
  await Promise.all(Object.values(QUEUES).map((q) => redis.lRem(q, 0, socketId)));
}

module.exports = function setupMatchmaking(socket, io, redis, pg) {

  // ── find_match ─────────────────────────────────────────────────────────────
  socket.on("find_match", async ({ difficulty = "random", eloRange = 300 } = {}) => {
    try {
      const diff     = VALID_DIFF.includes(difficulty) ? difficulty : "random";
      const queueKey = QUEUES[diff];

      console.log(
        `[Matchmaking] find_match: ${socket.id} diff=${diff} eloRange=${eloRange}` +
        (socket.user ? ` user=${socket.user.display_name}` : " [guest]")
      );

      const userElo    = await fetchElo(socket, pg);
      const waitingId  = await redis.rPop(queueKey);

      if (waitingId && waitingId !== socket.id) {
        const partnerSocket = io.sockets.sockets.get(waitingId);

        // Stale entry — discard partner, put self in queue
        if (!partnerSocket) {
          await redis.lPush(queueKey, socket.id);
          console.log(`[Matchmaking] Stale partner discarded, ${socket.id} queued in ${diff}`);
          return;
        }

        const partnerElo = await fetchElo(partnerSocket, pg);

        // ELO range check — both guests count as 1200, always within range
        if (Math.abs(userElo - partnerElo) > eloRange) {
          // Put partner back at tail (preserve their wait position), self at head
          await redis.rPush(queueKey, waitingId);
          await redis.lPush(queueKey, socket.id);
          console.log(
            `[Matchmaking] ELO gap too large (${userElo} vs ${partnerElo}), both re-queued in ${diff}`
          );
          return;
        }

        // ── Pair the two users ─────────────────────────────────────────────────
        const roomId = uuidv4();

        // Pick a problem matching the chosen difficulty
        const { rows } = diff === "random"
          ? await pg.query("SELECT * FROM problems ORDER BY RANDOM() LIMIT 1")
          : await pg.query(
              "SELECT * FROM problems WHERE LOWER(difficulty) = LOWER($1) ORDER BY RANDOM() LIMIT 1",
              [diff]
            );

        if (!rows.length) {
          // No problems for this difficulty — fail gracefully, restore partner
          console.error(`[Matchmaking] No problems found for difficulty: ${diff}`);
          await redis.rPush(queueKey, waitingId);
          socket.emit("match_error", { message: `No problems available for ${diff} difficulty.` });
          return;
        }

        const problem = rows[0];

        await redis.setEx(
          `room:${roomId}`,
          ROOM_TTL,
          JSON.stringify({ users: [socket.id, waitingId], problemId: problem.id, difficulty: diff })
        );
        await redis.setEx(`socket:${socket.id}`, ROOM_TTL, roomId);
        await redis.setEx(`socket:${waitingId}`,  ROOM_TTL, roomId);

        socket.join(roomId);
        partnerSocket.join(roomId);

        socket.emit("match_found",      { roomId, problem, opponentId: waitingId });
        partnerSocket.emit("match_found", { roomId, problem, opponentId: socket.id });

        console.log(
          `[Matchmaking] Paired ${socket.id} (ELO:${userElo}) ↔ ${waitingId} (ELO:${partnerElo})` +
          ` | diff:${diff} | room:${roomId.slice(0, 8)}`
        );

      } else {
        // Nobody waiting (or popped ourselves back) — join the queue
        if (waitingId === socket.id) {
          // edge case: popped self — just re-push
          await redis.lPush(queueKey, socket.id);
        } else {
          await redis.lPush(queueKey, socket.id);
        }
        console.log(`[Matchmaking] ${socket.id} added to ${diff} queue`);
      }

    } catch (err) {
      console.error("[Matchmaking] find_match error:", err);
      socket.emit("match_error", { message: "Failed to find a match. Please try again." });
    }
  });

  // ── cancel_match ───────────────────────────────────────────────────────────
  socket.on("cancel_match", async () => {
    try {
      await removeFromAllQueues(redis, socket.id);
      console.log(`[Matchmaking] ${socket.id} cancelled`);
    } catch (err) {
      console.error("[Matchmaking] cancel_match error:", err);
    }
  });

  // ── disconnect — clean up all queues ───────────────────────────────────────
  socket.on("disconnect", async () => {
    try {
      await removeFromAllQueues(redis, socket.id);
    } catch (err) {
      console.error("[Matchmaking] disconnect cleanup error:", err);
    }
  });
};
