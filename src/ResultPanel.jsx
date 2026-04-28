import "./components.css";

// Shows test case results after Run or Submit

export default function ResultPanel({ results, isLoading }) {
  if (isLoading) {
    return (
      <div className="result-panel">
        <div className="result-loading">
          <div className="result-spinner" />
          <p>Running your code...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="result-panel">
        <div className="result-empty">
          <p>Click <strong>Run</strong> to test against sample cases.</p>
          <p>Click <strong>Submit</strong> to check all test cases.</p>
        </div>
      </div>
    );
  }

  if (results.type === "error") {
    return (
      <div className="result-panel">
        <div className="result-error">
          <div className="result-status-badge fail">Error</div>
          <pre className="result-code">{results.error}</pre>
        </div>
      </div>
    );
  }

  if (results.type === "run") {
    return (
      <div className="result-panel">
        <div className={`result-status-badge ${results.passed ? "pass" : "fail"}`}>
          {results.passed ? "✓ Accepted" : "✗ Wrong Answer"}
        </div>

        <div className="result-row">
          <span className="result-label">Output</span>
          <pre className="result-code">{results.output || "(empty)"}</pre>
        </div>
        <div className="result-row">
          <span className="result-label">Expected</span>
          <pre className="result-code">{results.expected}</pre>
        </div>

        <div className="result-meta-row">
          <span className="result-meta">⏱ {results.runtime}</span>
          <span className="result-meta">💾 {results.memory}</span>
        </div>

        {results.error && (
          <div className="result-row">
            <span className="result-label error-label">Stderr</span>
            <pre className="result-code error">{results.error}</pre>
          </div>
        )}
      </div>
    );
  }

  if (results.type === "submit") {
    return (
      <div className="result-panel">
        <div className={`result-status-badge ${results.allPassed ? "pass" : "fail"}`}>
          {results.allPassed
            ? "✓ All Tests Passed!"
            : `✗ ${results.passCount}/${results.total} Passed`}
        </div>

        <div className="result-meta-row" style={{ marginBottom: "1rem" }}>
          <span className="result-meta">⏱ {results.runtime}</span>
          <span className="result-meta">💾 {results.memory}</span>
        </div>

        {results.caseResults.map((c) => (
          <div className={`case-row ${c.passed ? "pass" : "fail"}`} key={c.caseNum}>
            <span className="case-num">Case {c.caseNum}</span>
            <span className={`case-badge ${c.passed ? "pass" : "fail"}`}>
              {c.passed ? "Pass" : "Fail"}
            </span>
            {!c.passed && (
              <div className="case-detail">
                <div>Got: <code>{c.output || "(empty)"}</code></div>
                <div>Expected: <code>{c.expected}</code></div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
