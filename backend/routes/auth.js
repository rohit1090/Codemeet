const express  = require("express");
const passport = require("passport");
const jwt      = require("jsonwebtoken");

const router = express.Router();

function clientUrl() {
  return (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")[0].trim();
}

function jwtSecret() {
  return process.env.JWT_SECRET || "dev-jwt-secret-change-in-prod";
}

// ── GET /auth/google  → redirect to Google ────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ── GET /auth/google/callback  → Google redirects here ───────────────────────
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${clientUrl()}?auth=failed`,
    session: true,
  }),
  (req, res) => {
    const user  = req.user;
    const token = jwt.sign(
      {
        id:           user.id,
        email:        user.email,
        display_name: user.display_name,
        avatar_url:   user.avatar_url,
        elo:          user.elo ?? 1200,
        wins:         user.wins ?? 0,
        losses:       user.losses ?? 0,
      },
      jwtSecret(),
      { expiresIn: "7d" }
    );

    // Send token to frontend via URL param; frontend stores it in localStorage
    res.redirect(`${clientUrl()}/auth/callback?token=${token}`);
  }
);

// ── GET /auth/me  → validate JWT, return user ─────────────────────────────────
router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const user = jwt.verify(auth.slice(7), jwtSecret());
    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
