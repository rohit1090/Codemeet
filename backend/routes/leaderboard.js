const express = require("express");

module.exports = function leaderboardRouter(pg) {
  const router = express.Router();

  // GET /api/leaderboard  — top 50 users by ELO
  router.get("/", async (_req, res) => {
    try {
      const { rows } = await pg.query(`
        SELECT
          ROW_NUMBER() OVER (ORDER BY elo DESC) AS rank,
          id,
          display_name,
          avatar_url,
          elo,
          wins,
          losses,
          CASE WHEN (wins + losses) = 0 THEN 0
               ELSE ROUND(wins::numeric / (wins + losses) * 100, 1)
          END AS win_rate
        FROM users
        WHERE google_id IS NOT NULL
        ORDER BY elo DESC
        LIMIT 50
      `);
      res.json(rows);
    } catch (err) {
      console.error("[Leaderboard] error:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  return router;
};
