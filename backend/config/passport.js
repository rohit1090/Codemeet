const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");

module.exports = function setupPassport(pg) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                      "http://localhost:4000/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId    = profile.id;
          const email       = profile.emails?.[0]?.value || null;
          const displayName = profile.displayName || "Anonymous";
          const avatarUrl   = profile.photos?.[0]?.value  || null;

          const { rows } = await pg.query(
            `INSERT INTO users (google_id, email, display_name, avatar_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (google_id) DO UPDATE
               SET email        = EXCLUDED.email,
                   display_name = EXCLUDED.display_name,
                   avatar_url   = EXCLUDED.avatar_url
             RETURNING *`,
            [googleId, email, displayName, avatarUrl]
          );
          return done(null, rows[0]);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
};
