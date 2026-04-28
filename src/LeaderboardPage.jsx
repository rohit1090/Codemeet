import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import "./LeaderboardPage.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

const RANK_MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const RANK_COLORS = {
  1: { border: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
  2: { border: "#9ca3af", glow: "rgba(156,163,175,0.12)" },
  3: { border: "#cd7f32", glow: "rgba(205,127,50,0.12)" },
};

function eloBand(elo) {
  if (elo < 800)  return { label: "Beginner",     color: "#6b7280", bg: "rgba(107,114,128,0.15)" };
  if (elo < 1200) return { label: "Intermediate", color: "#63b374", bg: "rgba(99,179,116,0.15)"  };
  if (elo < 1600) return { label: "Advanced",     color: "#60a5fa", bg: "rgba(96,165,250,0.15)"  };
  if (elo < 2000) return { label: "Expert",       color: "#a78bfa", bg: "rgba(167,139,250,0.15)" };
  return           { label: "Master",             color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  };
}

export default function LeaderboardPage({ onBack, onFindMatch }) {
  const { user } = useAuth();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/leaderboard`)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setError("Failed to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  const userRow    = user ? rows.find((r) => r.id === user.id) : null;
  const userInTop  = !!userRow;
  const userBand   = user ? eloBand(user.elo ?? 1200) : null;

  return (
    <div className="lb-page">
      <div className="land-grid-bg" />

      {/* ── Navbar ── */}
      <nav className="land-nav">
        <span className="land-nav-logo" onClick={onBack} style={{ cursor: "pointer" }}>CodeMeet</span>
        <div className="land-nav-links">
          <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>Home</a>
          <a href="#" className="nav-active">Leaderboard</a>
          {user ? (
            <div className="nav-user">
              {user.avatar_url && (
                <img src={user.avatar_url} alt="" className="nav-avatar" referrerPolicy="no-referrer" />
              )}
              <span className="nav-username">{user.display_name}</span>
            </div>
          ) : null}
          <button className="nav-btn-solid" onClick={onFindMatch}>Start Coding</button>
        </div>
      </nav>

      <div className="lb-container">

        {/* ── Header ── */}
        <div className="lb-header">
          <h1 className="lb-title">Leaderboard</h1>
          <p className="lb-sub">Top 50 developers ranked by ELO rating</p>
        </div>

        {/* ── Your Rank card (when logged in) ── */}
        {user && (
          <div className="lb-your-rank">
            {user.avatar_url && (
              <img src={user.avatar_url} alt="" className="lb-yr-avatar" referrerPolicy="no-referrer" />
            )}
            <div className="lb-yr-info">
              <span className="lb-yr-name">{user.display_name}</span>
              <span className="lb-yr-rank">
                {userInTop ? `Rank #${userRow.rank}` : "Not yet ranked in top 50"}
              </span>
            </div>
            <div className="lb-yr-right">
              <span className="elo-pill" style={{ color: userBand.color, background: userBand.bg }}>
                {userBand.label}
              </span>
              <span className="lb-yr-elo">{user.elo ?? 1200} ELO</span>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        {loading && <div className="lb-status">Loading leaderboard...</div>}
        {error   && <div className="lb-status lb-error">{error}</div>}

        {!loading && !error && (
          <table className="lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Tier</th>
                <th>ELO</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isMe    = user?.id === row.id;
                const medal   = RANK_MEDAL[row.rank];
                const accent  = RANK_COLORS[row.rank];
                const band    = eloBand(Number(row.elo));

                return (
                  <tr
                    key={row.id}
                    className={`lb-row ${isMe ? "lb-row-me" : ""} ${accent ? "lb-row-top" : ""}`}
                    style={accent ? {
                      borderLeft: `3px solid ${accent.border}`,
                      background: accent.glow,
                    } : undefined}
                  >
                    <td className="lb-rank-cell">
                      {medal
                        ? <span className="lb-medal">{medal}</span>
                        : <span className="lb-rank-num">{row.rank}</span>}
                    </td>
                    <td className="lb-player-cell">
                      {row.avatar_url && (
                        <img
                          src={row.avatar_url}
                          alt=""
                          className="lb-avatar"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span className="lb-name">
                        {row.display_name}
                        {isMe && <span className="lb-you-tag">you</span>}
                      </span>
                    </td>
                    <td>
                      <span className="elo-pill" style={{ color: band.color, background: band.bg }}>
                        {band.label}
                      </span>
                    </td>
                    <td className="lb-elo-cell">
                      <span className="lb-elo-num">{row.elo}</span>
                    </td>
                    <td className="lb-stat">{row.wins}</td>
                    <td className="lb-stat">{row.losses}</td>
                    <td className="lb-stat">
                      <span className={`lb-wr ${Number(row.win_rate) >= 50 ? "good" : ""}`}>
                        {row.win_rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="lb-status">No players yet. Be the first to complete a match!</div>
        )}
      </div>
    </div>
  );
}
