import "./Landing.css";

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

export default function Landing({ onFindMatch, onProblems }) {
  return (
    <div className="land-page">
      <div className="land-grid-bg" />

      {/* Navbar */}
      <nav className="land-nav">
        <span className="land-nav-logo">CodeMeet</span>
        <div className="land-nav-links">
          <a href="#features">Features</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onProblems(); }}>Problems</a>
          <button className="nav-btn-ghost">Log in</button>
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
