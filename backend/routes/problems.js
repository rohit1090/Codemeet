const express = require("express");

/**
 * Returns an Express router pre-bound to the given pg pool.
 *
 * Routes:
 *   GET /api/problems       – list all problems (id, title, difficulty)
 *   GET /api/problems/:id   – full problem data including test cases and starter code
 */
module.exports = function problemsRouter(pg) {
  const router = express.Router();

  // ── GET /api/problems ──────────────────────────────────────────────────────
  router.get("/", async (_req, res) => {
    try {
      const { rows } = await pg.query(
        "SELECT id, title, difficulty FROM problems ORDER BY id"
      );
      res.json(rows);
    } catch (err) {
      console.error("[Problems] GET / error:", err);
      res.status(500).json({ error: "Failed to fetch problems" });
    }
  });

  // ── GET /api/problems/:id ──────────────────────────────────────────────────
  router.get("/:id", async (req, res) => {
    try {
      const { rows } = await pg.query(
        "SELECT * FROM problems WHERE id = $1",
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Problem not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error(`[Problems] GET /${req.params.id} error:`, err);
      res.status(500).json({ error: "Failed to fetch problem" });
    }
  });

  return router;
};
