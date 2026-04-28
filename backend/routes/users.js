const express = require("express");

module.exports = function usersRouter(pg) {
  const router = express.Router();

  // GET /api/users/:id/profile
  router.get("/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;

      const [userResult, historyResult, diffResult] = await Promise.all([
        // Base user stats
        pg.query(
          `SELECT id, display_name, avatar_url, elo, wins, losses, created_at
           FROM users WHERE id = $1`,
          [id]
        ),
        // Recent 10 matches
        pg.query(
          `SELECT
             mh.result,
             mh.elo_change,
             mh.duration_seconds,
             mh.created_at,
             p.title  AS problem_title,
             p.difficulty,
             u.display_name AS partner_name,
             u.avatar_url   AS partner_avatar
           FROM match_history mh
           LEFT JOIN problems p ON p.id = mh.problem_id
           LEFT JOIN users u    ON u.id = mh.partner_id
           WHERE mh.user_id = $1
           ORDER BY mh.created_at DESC
           LIMIT 10`,
          [id]
        ),
        // Problems solved by difficulty
        pg.query(
          `SELECT p.difficulty, COUNT(*) AS count
           FROM match_history mh
           JOIN problems p ON p.id = mh.problem_id
           WHERE mh.user_id = $1 AND mh.result = 'win'
           GROUP BY p.difficulty`,
          [id]
        ),
      ]);

      if (!userResult.rows.length) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userResult.rows[0];
      const totalMatches = user.wins + user.losses;

      res.json({
        ...user,
        win_rate: totalMatches === 0 ? 0 : Math.round((user.wins / totalMatches) * 100),
        problems_by_difficulty: {
          Easy:   0,
          Medium: 0,
          Hard:   0,
          ...Object.fromEntries(diffResult.rows.map((r) => [r.difficulty, Number(r.count)])),
        },
        recent_matches: historyResult.rows,
      });
    } catch (err) {
      console.error("[Users] profile error:", err);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  return router;
};
