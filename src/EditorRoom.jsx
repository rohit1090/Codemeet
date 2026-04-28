import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import ProblemPanel  from "./ProblemPanel";
import ChatPanel     from "./ChatPanel";
import ResultPanel   from "./ResultPanel";
import { useCodeSync } from "./hooks/useCodeSync";
import { useAuth } from "./context/AuthContext";
import "./EditorRoom.css";

// Judge0 language IDs — https://ce.judge0.com/languages/
const LANGUAGES = [
  { label: "Python",     value: "python",     judge0Id: 71 },
  { label: "JavaScript", value: "javascript", judge0Id: 63 },
  { label: "Java",       value: "java",       judge0Id: 62 },
  { label: "C++",        value: "cpp",        judge0Id: 54 },
  { label: "Go",         value: "go",         judge0Id: 60 },
];

// Fallback templates used when the problem has no starter_code for that language
const FALLBACK_CODE = {
  python:     "# Write your solution here\n",
  javascript: "// Write your solution here\n",
  java:       "public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  cpp:        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  go:         "package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println()\n}\n",
};

const JUDGE0_URL = process.env.REACT_APP_JUDGE0_URL || "http://localhost:2358";

// Safe base64 encode that handles non-Latin1 characters
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromBase64(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

export default function EditorRoom({ matchData, onLeave, onLeaderboard }) {
  const { roomId, problem, socket } = matchData;
  const { user, updateElo } = useAuth();

  const getStarterCode = useCallback(
    (lang) => problem?.starter_code?.[lang.value] || FALLBACK_CODE[lang.value],
    [problem]
  );

  const [language,     setLanguage]     = useState(LANGUAGES[0]);
  const [code,         setCode]         = useState(() => getStarterCode(LANGUAGES[0]));
  const [isRunning,    setIsRunning]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results,      setResults]      = useState(null);
  const [activeTab,    setActiveTab]    = useState("problem");
  const [partnerLeft,  setPartnerLeft]  = useState(false);
  const [matchResult,  setMatchResult]  = useState(null); // { result, eloChange, newElo }
  const [eloDisplay,   setEloDisplay]   = useState(user?.elo ?? 1200);
  const [eloAnim,      setEloAnim]      = useState(null);  // { change: +18 }

  const editorRef    = useRef(null);
  const sessionStart = useRef(Date.now());

  // ── partner_left + match_result ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on("partner_left", ({ message }) => {
      console.log("[EditorRoom] partner_left:", message);
      setPartnerLeft(true);
    });

    socket.on("match_result", ({ result, eloChange, newElo }) => {
      console.log("[EditorRoom] match_result:", { result, eloChange, newElo });
      setMatchResult({ result, eloChange, newElo });

      if (eloChange !== null && newElo !== null) {
        setEloDisplay(newElo);
        setEloAnim({ change: eloChange });
        updateElo(newElo);
        setTimeout(() => setEloAnim(null), 3000);
      }
    });

    return () => {
      socket.off("partner_left");
      socket.off("match_result");
    };
  }, [socket, updateElo]);

  // ── Language change coming from partner via useCodeSync ──────────────────────
  const handleLanguageChange = useCallback(
    (languageValue) => {
      const lang = LANGUAGES.find((l) => l.value === languageValue);
      if (lang) {
        setLanguage(lang);
        setCode(getStarterCode(lang));
      }
    },
    [getStarterCode]
  );

  // ── Code sync hook (debounced emit + partner update listener) ────────────────
  const { syncCode } = useCodeSync({
    socket,
    roomId,
    editorRef,
    onLanguageChange: handleLanguageChange,
  });

  function handleCodeChange(newCode) {
    setCode(newCode);
    syncCode(newCode);
  }

  // ── Language switch (local user) ─────────────────────────────────────────────
  function switchLanguage(lang, broadcast = true) {
    setLanguage(lang);
    setCode(getStarterCode(lang));
    if (broadcast) {
      socket?.emit("language_change", { roomId, languageValue: lang.value });
    }
  }

  // ── Run (sample test case only) ──────────────────────────────────────────────
  // The DB stores test cases in snake_case as `test_cases` with { input, output } fields.
  const runCode = useCallback(async () => {
    const testCases = problem?.test_cases;
    if (!testCases?.length) {
      setResults({ type: "error", error: "No test cases found for this problem." });
      setActiveTab("results");
      return;
    }

    setIsRunning(true);
    setActiveTab("results");
    setResults(null);

    try {
      const sample = testCases[0];

      const res = await fetch(
        `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language_id: language.judge0Id,
            source_code: toBase64(code),
            stdin:        toBase64(sample.input),
          }),
        }
      );

      const data   = await res.json();
      const output = data.stdout ? fromBase64(data.stdout).trim() : "";
      const expected = (sample.output ?? "").trim();

      console.log("[EditorRoom] run result:", { output, expected, status: data.status });

      setResults({
        type:    "run",
        passed:  output === expected,
        output,
        expected,
        runtime: data.time   ? `${(data.time * 1000).toFixed(0)}ms`     : "N/A",
        memory:  data.memory ? `${(data.memory / 1024).toFixed(1)} MB`  : "N/A",
        error:   data.stderr ? fromBase64(data.stderr) : null,
      });
    } catch (err) {
      setResults({ type: "error", error: "Could not connect to the code execution server." });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, problem]);

  // ── Submit (all test cases) ──────────────────────────────────────────────────
  const submitCode = useCallback(async () => {
    const testCases = problem?.test_cases;
    if (!testCases?.length) {
      setResults({ type: "error", error: "No test cases found for this problem." });
      setActiveTab("results");
      return;
    }

    setIsSubmitting(true);
    setActiveTab("results");
    setResults(null);

    try {
      const responses = await Promise.all(
        testCases.map((tc) =>
          fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language_id: language.judge0Id,
              source_code: toBase64(code),
              stdin:        toBase64(tc.input),
            }),
          }).then((r) => r.json())
        )
      );

      let passCount = 0;
      const caseResults = responses.map((res, i) => {
        const output   = res.stdout ? fromBase64(res.stdout).trim() : "";
        const expected = (testCases[i].output ?? "").trim();
        const passed   = output === expected;
        if (passed) passCount++;
        return { caseNum: i + 1, passed, output, expected };
      });

      console.log("[EditorRoom] submit:", { passCount, total: testCases.length });

      const allPassed = passCount === testCases.length;

      setResults({
        type:      "submit",
        passCount,
        total:     testCases.length,
        allPassed,
        caseResults,
        runtime:   responses[0]?.time   ? `${(responses[0].time * 1000).toFixed(0)}ms`    : "N/A",
        memory:    responses[0]?.memory ? `${(responses[0].memory / 1024).toFixed(1)} MB` : "N/A",
      });

      // Notify backend — triggers ELO update if first correct submission in room
      const durationSeconds = Math.floor((Date.now() - sessionStart.current) / 1000);
      socket?.emit("submit_result", { roomId, passed: allPassed, durationSeconds });

    } catch (err) {
      setResults({ type: "error", error: "Could not connect to the code execution server." });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, language, problem, socket, roomId]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="editor-page">

      {/* ── Partner-left overlay ── */}
      {partnerLeft && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#111318",
            border: "1px solid #2a2d35",
            borderRadius: "14px",
            padding: "2.5rem 2rem",
            textAlign: "center",
            maxWidth: "360px",
            width: "90%",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>👋</div>
            <h2 style={{ color: "#fff", margin: "0 0 0.5rem", fontSize: "1.2rem" }}>
              Your partner left the session
            </h2>
            <p style={{ color: "#888", fontSize: "0.875rem", margin: "0 0 1.75rem" }}>
              Your coding partner has disconnected. Find a new match to keep practising.
            </p>
            <button
              onClick={onLeave}
              style={{
                background: "#63b374", color: "#fff",
                border: "none", borderRadius: "8px",
                padding: "0.65rem 1.5rem",
                fontSize: "0.9rem", fontWeight: 600,
                cursor: "pointer", width: "100%",
              }}
            >
              Find New Match
            </button>
          </div>
        </div>
      )}

      {/* ── Match result overlay ── */}
      {matchResult && (
        <div className="match-result-overlay" onClick={() => setMatchResult(null)}>
          <div className={`match-result-card ${matchResult.result}`}>
            <div className="mr-icon">{matchResult.result === "win" ? "🏆" : "💡"}</div>
            <h2 className="mr-title">
              {matchResult.result === "win" ? "You solved it first!" : "Partner solved it first"}
            </h2>
            <p className="mr-sub">
              {matchResult.result === "win"
                ? "Great work! You won this round."
                : "Keep practising — you'll get the next one."}
            </p>
            {matchResult.eloChange !== null && (
              <div className={`mr-elo ${matchResult.eloChange >= 0 ? "pos" : "neg"}`}>
                {matchResult.eloChange >= 0 ? "+" : ""}{matchResult.eloChange} ELO
                <span className="mr-elo-new">→ {matchResult.newElo}</span>
              </div>
            )}
            <button className="mr-btn" onClick={onLeave}>Find New Match</button>
            {onLeaderboard && (
              <button className="mr-btn mr-btn-secondary" onClick={onLeaderboard}>
                View Leaderboard
              </button>
            )}
            <button className="mr-dismiss" onClick={() => setMatchResult(null)}>Keep Coding</button>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <header className="editor-topbar">
        <div className="topbar-left">
          <span className="editor-logo">CodeMeet</span>
          {user && (
            <div className="elo-badge-wrap">
              <div className="elo-badge" title="Your ELO rating">
                <span className="elo-icon">⚡</span>
                <span className="elo-value">{eloDisplay}</span>
              </div>
              {eloAnim && (
                <span className={`elo-anim ${eloAnim.change >= 0 ? "elo-up" : "elo-down"}`}>
                  {eloAnim.change >= 0 ? "+" : ""}{eloAnim.change}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="topbar-center">
          <div className="match-pill">
            <span className="match-dot" />
            Matched · Room {roomId?.slice(0, 8)}
          </div>
        </div>
        <div className="topbar-right">
          <select
            className="lang-select"
            value={language.value}
            onChange={(e) => {
              const lang = LANGUAGES.find((l) => l.value === e.target.value);
              switchLanguage(lang);
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          <button
            className="btn-run"
            onClick={runCode}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? "Running..." : "▷ Run"}
          </button>

          <button
            className="btn-submit"
            onClick={submitCode}
            disabled={isRunning || isSubmitting}
          >
            {isSubmitting ? "Checking..." : "Submit"}
          </button>

          {/* Leave does NOT disconnect the socket here — App.jsx handles that */}
          <button className="btn-leave" onClick={onLeave}>
            Leave
          </button>
        </div>
      </header>

      {/* ── Main 3-panel layout ── */}
      <div className="editor-body">

        {/* LEFT — Problem / Results tabs */}
        <aside className="panel-left">
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activeTab === "problem" ? "active" : ""}`}
              onClick={() => setActiveTab("problem")}
            >
              Problem
            </button>
            <button
              className={`panel-tab ${activeTab === "results" ? "active" : ""}`}
              onClick={() => setActiveTab("results")}
            >
              Results
            </button>
          </div>
          {activeTab === "problem" ? (
            <ProblemPanel problem={problem} />
          ) : (
            <ResultPanel results={results} isLoading={isRunning || isSubmitting} />
          )}
        </aside>

        {/* CENTRE — Monaco Editor */}
        <main className="panel-editor">
          <div className="editor-users-bar">
            <span className="user-tag you">● You</span>
            <span className="user-tag partner">● Partner</span>
          </div>
          <div className="monaco-wrapper">
            <Editor
              height="100%"
              language={language.value}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              onMount={(editor) => { editorRef.current = editor; }}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap:              { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers:          "on",
                renderLineHighlight:  "line",
                cursorBlinking:       "smooth",
                automaticLayout:      true,
                tabSize:              4,
                wordWrap:             "on",
              }}
            />
          </div>
        </main>

        {/* RIGHT — Chat */}
        <aside className="panel-right">
          <ChatPanel roomId={roomId} socket={socket} />
        </aside>

      </div>
    </div>
  );
}
