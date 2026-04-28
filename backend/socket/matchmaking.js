const { v4: uuidv4 } = require("uuid");

const WAITING_QUEUE = "codemeet:waiting_queue";
const ROOM_TTL      = 7200; // 2 hours in seconds

/**
 * Handles matchmaking events for a single socket:
 *   find_match   – join the waiting queue; if someone else is waiting, pair up
 *   cancel_match – leave the waiting queue
 */
module.exports = function setupMatchmaking(socket, io, redis, pg) {

  // ── find_match ─────────────────────────────────────────────────────────────
  socket.on("find_match", async () => {
    try {
      // Pop the oldest waiting user from the right of the queue
      const waitingId = await redis.rPop(WAITING_QUEUE);

      if (waitingId && waitingId !== socket.id) {
        // Verify the popped socket is still connected (could have dropped)
        const partnerSocket = io.sockets.sockets.get(waitingId);

        if (!partnerSocket) {
          // Stale entry — put current user in queue and wait
          await redis.lPush(WAITING_QUEUE, socket.id);
          return;
        }

        // ── Pair the two users ───────────────────────────────────────────────
        const roomId = uuidv4();

        // Pick a random problem from the database
        const { rows } = await pg.query(
          "SELECT * FROM problems ORDER BY RANDOM() LIMIT 1"
        );
        const problem = rows[0];

        // Persist room metadata in Redis (expires with the session)
        await redis.setEx(
          `room:${roomId}`,
          ROOM_TTL,
          JSON.stringify({ users: [socket.id, waitingId], problemId: problem.id })
        );

        // Track which room each socket belongs to (used during disconnect cleanup)
        await redis.setEx(`socket:${socket.id}`, ROOM_TTL, roomId);
        await redis.setEx(`socket:${waitingId}`,  ROOM_TTL, roomId);

        // Join both sockets into the Socket.io room for easy broadcast
        socket.join(roomId);
        partnerSocket.join(roomId);

        // Notify both users — each gets the other's ID as opponentId
        socket.emit("match_found", {
          roomId,
          problem,
          opponentId: waitingId,
        });
        partnerSocket.emit("match_found", {
          roomId,
          problem,
          opponentId: socket.id,
        });

        console.log(`[Matchmaking] Paired ${socket.id} ↔ ${waitingId} in room ${roomId}`);

      } else {
        // Nobody waiting — add this user to the back of the queue
        if (waitingId === socket.id) {
          // Edge case: we popped ourselves somehow; just re-add
          await redis.lPush(WAITING_QUEUE, socket.id);
        } else {
          await redis.lPush(WAITING_QUEUE, socket.id);
        }
        console.log(`[Matchmaking] ${socket.id} added to queue`);
      }

    } catch (err) {
      console.error("[Matchmaking] find_match error:", err);
      socket.emit("match_error", { message: "Failed to find a match. Please try again." });
    }
  });

  // ── cancel_match ───────────────────────────────────────────────────────────
  socket.on("cancel_match", async () => {
    try {
      await redis.lRem(WAITING_QUEUE, 0, socket.id);
      console.log(`[Matchmaking] ${socket.id} left the queue`);
    } catch (err) {
      console.error("[Matchmaking] cancel_match error:", err);
    }
  });

  // ── Clean up queue on disconnect (user closed tab while waiting) ───────────
  socket.on("disconnect", async () => {
    try {
      await redis.lRem(WAITING_QUEUE, 0, socket.id);
    } catch (err) {
      console.error("[Matchmaking] disconnect cleanup error:", err);
    }
  });
};
