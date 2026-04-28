import "./Landing.css";
import { useAuth } from "./context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

// Stats shown on the homepage
const STATS = [
  { num: "2,847", label: "Online Now" },
  { num: "150+",  label: "DSA Problems" },
  { num: "98k",   label: "Sessions Today" },
];

// Feature cards shown below the hero
const FEATURES = [
  {
    icon: "⚡",
    title: "Real-time Collaboration",
    desc: "Both you and your partner type in the same editor simultaneously — like Google Docs for code.",
  },
  {
    icon: "🎯",
    title: "Live Code Execution",
    desc: "Run your solution against test cases instantly. Supports Python, Java, C++, JavaScript and more.",
  },
  {
    icon: "🔀",
    title: "Random Matching",
    desc: "Get paired with a random developer in seconds. No sign-up needed to get started.",
  },
];

export default function Landing({ onFindMatch, onProblems, onLeaderboard }) {
  const { user, logout } = useAuth();

  return (
    <div className="land-page">
      <div className="land-grid-bg" />

      {/* Navbar */}
      <nav className="land-nav">
        <span className="land-nav-logo">CodeMeet</span>
        <div className="land-nav-links">
          <a href="#features">Features</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onProblems(); }}>Problems</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onLeaderboard(); }}>Leaderboard</a>
          {user ? (
            <div className="nav-user">
              {user.avatar_url && (
                <img src={user.avatar_url} alt="" className="nav-avatar" referrerPolicy="no-referrer" />
              )}
              <span className="nav-username">{user.display_name}</span>
              <button className="nav-btn-ghost" onClick={logout}>Log out</button>
            </div>
          ) : (
            <a href={`${BACKEND_URL}/auth/google`} className="nav-btn-ghost nav-login-btn">
              <svg width="16" height="16" viewBox="0 0 48 48" style={{marginRight:6,verticalAlign:"middle"}}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Log in with Google
            </a>
          )}
          <button className="nav-btn-solid" onClick={onFindMatch}>
            Start Coding
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="land-badge">🚀 Now in Beta · Free to use</div>
        <h1 className="land-title">
          Code Together,<br />
          <span className="land-title-accent">Beat the Algorithm</span>
        </h1>
        <p className="land-subtitle">
          Match with a random developer. Solve DSA problems in real-time.
          <br />
          Like Omegle — but for coding interviews.
        </p>
        <div className="land-cta-row">
          <button className="cta-primary" onClick={onFindMatch}>
            Find a Match →
          </button>
          <button className="cta-secondary">Watch Demo</button>
        </div>
        <div className="land-stats">
          {STATS.map((s) => (
            <div className="stat-item" key={s.label}>
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="land-features" id="features">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.title}>
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
