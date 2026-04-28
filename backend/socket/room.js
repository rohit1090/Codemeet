const jwt = require("jsonwebtoken");

function calcEloChange(playerElo, opponentElo, result, K = 30) {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual   = result === "win" ? 1 : result === "loss" ? 0 : 0.5;
  return Math.round(K * (actual - expected));
}

module.exports = function setupRoom(socket, io, redis, pg) {

  // ── code_change ────────────────────────────────────────────────────────────
  socket.on("code_change", ({ roomId, code }) => {
    try {
      socket.to(roomId).emit("code_update", { code });
    } catch (err) {
      console.error("[Room] code_change error:", err);
    }
  });

  // ── language_change ────────────────────────────────────────────────────────
  socket.on("language_change", ({ roomId, languageValue }) => {
    try {
      socket.to(roomId).emit("language_update", { languageValue });
    } catch (err) {
      console.error("[Room] language_change error:", err);
    }
  });

  // ── send_message ───────────────────────────────────────────────────────────
  socket.on("send_message", ({ roomId, text }) => {
    try {
      socket.to(roomId).emit("receive_message", { text, senderId: socket.id });
    } catch (err) {
      console.error("[Room] send_message error:", err);
    }
  });

  // ── submit_result ──────────────────────────────────────────────────────────
  // Fired by the frontend after Judge0 returns all-pass for a submission.
  // First correct submission in a room = winner. ELO updated only when both
  // sockets are authenticated users.
  socket.on("submit_result", async ({ roomId, passed, durationSeconds }) => {
    try {
      const submitKey = `submitted:${roomId}`;

      const raw   = await redis.get(submitKey);
      const state = raw ? JSON.parse(raw) : { resolved: false, results: {} };

      if (state.resolved) return; // already processed this room

      state.results[socket.id] = passed;

      if (!passed) {
        await redis.setEx(submitKey, 7200, JSON.stringify(state));
        return;
      }

      // ── First correct submission ─────────────────────────────────────────
      state.resolved = true;
      await redis.setEx(submitKey, 7200, JSON.stringify(state));

      // Resolve partner socket
      const roomRaw = await redis.get(`room:${roomId}`);
      if (!roomRaw) return;
      const { users, problemId } = JSON.parse(roomRaw);
      const partnerSocketId = users.find((id) => id !== socket.id);
      const partnerSocket   = io.sockets.sockets.get(partnerSocketId);

      const winnerUser = socket.user       || null;
      const loserUser  = partnerSocket?.user || null;

      let winnerChange = null, loserChange = null;
      let winnerNewElo = null, loserNewElo = null;

      // ── ELO + match_history (only if both users are authenticated) ────────
      if (winnerUser?.id && loserUser?.id && pg) {
        const [{ rows: wRows }, { rows: lRows }] = await Promise.all([
          pg.query("SELECT elo FROM users WHERE id = $1", [winnerUser.id]),
          pg.query("SELECT elo FROM users WHERE id = $1", [loserUser.id]),
        ]);

        const winnerElo = wRows[0]?.elo ?? 1200;
        const loserElo  = lRows[0]?.elo ?? 1200;

        winnerChange = calcEloChange(winnerElo, loserElo, "win");
        loserChange  = calcEloChange(loserElo, winnerElo, "loss");
        winnerNewElo = winnerElo + winnerChange;
        loserNewElo  = loserElo  + loserChange;

        await Promise.all([
          pg.query(
            "UPDATE users SET elo = $1, wins = wins + 1 WHERE id = $2",
            [winnerNewElo, winnerUser.id]
          ),
          pg.query(
            "UPDATE users SET elo = $1, losses = losses + 1 WHERE id = $2",
            [loserNewElo, loserUser.id]
          ),
          pg.query(
            `INSERT INTO match_history (user_id, partner_id, problem_id, result, elo_change, duration_seconds)
             VALUES ($1,$2,$3,'win',$4,$5)`,
            [winnerUser.id, loserUser.id, problemId, winnerChange, durationSeconds ?? null]
          ),
          pg.query(
            `INSERT INTO match_history (user_id, partner_id, problem_id, result, elo_change, duration_seconds)
             VALUES ($1,$2,$3,'loss',$4,$5)`,
            [loserUser.id, winnerUser.id, problemId, loserChange, durationSeconds ?? null]
          ),
        ]);

        console.log(
          `[Room] ELO updated — winner ${winnerUser.id}: ${winnerElo}→${winnerNewElo} ` +
          `(${winnerChange >= 0 ? "+" : ""}${winnerChange})`
        );
      }

      // ── Emit match_result to both sockets ─────────────────────────────────
      socket.emit("match_result", {
        result:    "win",
        eloChange: winnerChange,
        newElo:    winnerNewElo,
      });

      if (partnerSocket) {
        partnerSocket.emit("match_result", {
          result:    "loss",
          eloChange: loserChange,
          newElo:    loserNewElo,
        });
      }

    } catch (err) {
      console.error("[Room] submit_result error:", err);
    }
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    try {
      const roomId = await redis.get(`socket:${socket.id}`);
      if (!roomId) return;

      const raw = await redis.get(`room:${roomId}`);
      if (raw) {
        const { users } = JSON.parse(raw);
        const partnerId = users.find((id) => id !== socket.id);

        if (partnerId) {
          io.to(partnerId).emit("partner_left", {
            message: "Your partner has disconnected.",
          });
          await redis.del(`socket:${partnerId}`);
        }

        await redis.del(`room:${roomId}`);
      }

      await redis.del(`socket:${socket.id}`);
      console.log(`[Room] Cleaned up room ${roomId} after ${socket.id} disconnected`);
    } catch (err) {
      console.error("[Room] disconnect cleanup error:", err);
    }
  });
};
