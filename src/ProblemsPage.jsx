import { useEffect, useState } from "react";
import { getProblems } from "./api/problems";
import "./ProblemsPage.css";

const DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

export default function ProblemsPage({ onFindMatch, onBack }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState("All");

  useEffect(() => {
    getProblems()
      .then(setProblems)
      .catch(() => setError("Failed to load problems. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  const visible = filter === "All"
    ? problems
    : problems.filter((p) => p.difficulty === filter);

  return (
    <div className="prob-page">
      <div className="land-grid-bg" />

      <nav className="land-nav">
        <span className="land-nav-logo" onClick={onBack} style={{ cursor: "pointer" }}>
          CodeMeet
        </span>
        <div className="land-nav-links">
          <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>Home</a>
          <a href="#" className="nav-active">Problems</a>
          <button className="nav-btn-solid" onClick={onFindMatch}>Start Coding</button>
        </div>
      </nav>

      <div className="prob-container">
        <div className="prob-header">
          <h1>Problem Set</h1>
          <p>{problems.length} problems · Pick one or get matched randomly</p>
        </div>

        <div className="prob-filters">
          {["All", "Easy", "Medium", "Hard"].map((d) => (
            <button
              key={d}
              className={`filter-btn filter-${d.toLowerCase()} ${filter === d ? "active" : ""}`}
              onClick={() => setFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {loading && <div className="prob-status">Loading problems...</div>}
        {error   && <div className="prob-status prob-error">{error}</div>}

        {!loading && !error && (
          <table className="prob-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible
                .slice()
                .sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] || a.id - b.id)
                .map((p, i) => (
                  <tr key={p.id}>
                    <td className="prob-num">{i + 1}</td>
                    <td className="prob-title">{p.title}</td>
                    <td>
                      <span className={`diff-badge diff-${p.difficulty.toLowerCase()}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td>
                      <button className="solve-btn" onClick={onFindMatch}>
                        Solve →
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="prob-status">No {filter} problems found.</div>
        )}
      </div>
    </div>
  );
}
