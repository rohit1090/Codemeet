/**
 * Handles in-room Socket.io events for a single socket:
 *   code_change     – sync editor content to partner
 *   language_change – sync language selection to partner
 *   send_message    – relay chat message to partner
 *   disconnect      – notify partner and clean up Redis room state
 */
module.exports = function setupRoom(socket, io, redis) {

  // ── code_change ────────────────────────────────────────────────────────────
  // Broadcast the updated code to everyone in the room except the sender.
  // The frontend preserves cursor position on the receiving end.
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
      socket.to(roomId).emit("receive_message", {
        text,
        senderId: socket.id,
      });
    } catch (err) {
      console.error("[Room] send_message error:", err);
    }
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    try {
      // Look up which room this socket was in
      const roomId = await redis.get(`socket:${socket.id}`);
      if (!roomId) return; // Was in the waiting queue, not a room — matchmaking.js handles that

      // Find the partner and notify them
      const raw = await redis.get(`room:${roomId}`);
      if (raw) {
        const { users } = JSON.parse(raw);
        const partnerId = users.find((id) => id !== socket.id);

        if (partnerId) {
          io.to(partnerId).emit("partner_left", {
            message: "Your partner has disconnected.",
          });
          // Remove the partner's room pointer so their next disconnect is a no-op
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
