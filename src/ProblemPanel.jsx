import "./components.css";

// Renders the problem description — title, difficulty, description, examples

export default function ProblemPanel({ problem }) {
  if (!problem) return <div className="prob-loading">Loading problem...</div>;

  const diffClass = problem.difficulty.toLowerCase(); // "easy" | "medium" | "hard"

  return (
    <div className="prob-panel">
      <div className="prob-header">
        <span className="prob-num">#{problem.id}</span>
        <h2 className="prob-title">{problem.title}</h2>
        <span className={`diff-badge ${diffClass}`}>{problem.difficulty}</span>
      </div>

      <div className="prob-body">
        <p className="prob-desc">{problem.description}</p>

        {problem.examples.map((ex, i) => (
          <div className="example-block" key={i}>
            <div className="example-label">Example {i + 1}</div>
            <div className="example-content">
              <div><span className="ex-key">Input:</span>  {ex.input}</div>
              <div><span className="ex-key">Output:</span> {ex.output}</div>
              {ex.explanation && (
                <div className="ex-explain">
                  <span className="ex-key">Explanation:</span> {ex.explanation}
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="constraints-block">
          <div className="constraints-label">Constraints</div>
          {problem.constraints.map((c, i) => (
            <div className="constraint-item" key={i}>· {c}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
