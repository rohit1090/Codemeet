import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./context/AuthContext";
import "./components.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

const DIFFICULTIES = [
  {
    id: "easy", label: "Easy", emoji: "🟢",
    color: "#63b374", bg: "rgba(99,179,116,0.08)",
    border: "rgba(99,179,116,0.25)",
    desc: "Arrays, strings, basic logic",
    avgWait: "~10s",
  },
  {
    id: "medium", label: "Medium", emoji: "🟡",
    color: "#ef9f27", bg: "rgba(239,159,39,0.08)",
    border: "rgba(239,159,39,0.25)",
    desc: "Trees, graphs, DP problems",
    avgWait: "~25s",
  },
  {
    id: "hard", label: "Hard", emoji: "🔴",
    color: "#e07070", bg: "rgba(224,112,112,0.08)",
    border: "rgba(224,112,112,0.25)",
    desc: "Advanced algorithms",
    avgWait: "~60s",
  },
  {
    id: "random", label: "Random", emoji: "🎲",
    color: "#a78bfa", bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
    desc: "Any difficulty — fastest match",
    avgWait: "~15s",
  },
];

export default function WaitingRoom({ onMatchFound, onCancel, initialDifficulty }) {
  const { getToken } = useAuth();
  const socketRef    = useRef(null);
  const matchedRef   = useRef(false);
  // Keep a ref so the match_found closure always sees the current value
  const selectedDiffRef = useRef(initialDifficulty || null);

  const [phase,        setPhase]        = useState(initialDifficulty ? "waiting" : "select");
  const [selectedDiff, setSelectedDiff] = useState(initialDifficulty || null);
  const [queueCounts,  setQueueCounts]  = useState({ easy: 0, medium: 0, hard: 0, random: 0 });
  const [waitTime,     setWaitTime]     = useState(0);
  const [error,        setError]        = useState(null);
  const [retryKey,     setRetryKey]     = useState(0);

  // ── Socket — created immediately so queue counts update on selection screen ──
  useEffect(() => {
    matchedRef.current = false;
    setError(null);
    setPhase("select");
    setSelectedDiff(null);

    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      allowEIO3:  true,
      reconnectionAttempts: 3,
      reconnectionDelay:    1500,
      auth: { token: getToken() || "" },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WaitingRoom] Connected:", socket.id);
      setError(null);
      // Rematch flow: skip selection screen and queue immediately
      if (initialDifficulty) {
        socket.emit("find_match", { difficulty: initialDifficulty, eloRange: 300 });
        console.log("[WaitingRoom] auto find_match (rematch):", initialDifficulty);
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[WaitingRoom] Connection error:", err.message);
      setError(`Could not reach server: ${err.message}`);
    });

    socket.on("match_found", (data) => {
      console.log("[WaitingRoom] match_found:", data);
      matchedRef.current = true;
      onMatchFound({ ...data, socket, difficulty: selectedDiffRef.current });
    });

    socket.on("queue_update", (counts) => {
      setQueueCounts(counts);
    });

    socket.on("match_error", ({ message }) => {
      console.error("[WaitingRoom] match_error:", message);
      setError(message);
      setPhase("select");
    });

    return () => {
      if (!matchedRef.current) {
        socket.emit("cancel_match");
        socket.disconnect();
      }
    };
  }, [retryKey, onMatchFound, getToken, initialDifficulty]);

  // ── Wait timer — only runs while in "waiting" phase ─────────────────────────
  useEffect(() => {
    if (phase !== "waiting") return;
    setWaitTime(0);
    const timer = setInterval(() => setWaitTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  function handleSelectDifficulty(diff) {
    selectedDiffRef.current = diff;
    setSelectedDiff(diff);
    setPhase("waiting");
    socketRef.current?.emit("find_match", { difficulty: diff, eloRange: 300 });
    console.log("[WaitingRoom] find_match emitted:", diff);
  }

  function handleChangeDifficulty() {
    socketRef.current?.emit("cancel_match");
    setPhase("select");
    setSelectedDiff(null);
  }

  function handleCancel() {
    socketRef.current?.emit("cancel_match");
    socketRef.current?.disconnect();
    onCancel();
  }

  function handleRetry() {
    setError(null);
    setRetryKey((k) => k + 1);
  }

  function formatTime(s) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  const selConfig = DIFFICULTIES.find((d) => d.id === selectedDiff);

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="wait-page">
        <div className="wait-card">
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 className="wait-title" style={{ color: "#e07070" }}>Oops!</h2>
          <p className="wait-hint" style={{ color: "#e07070", marginBottom: "1.5rem" }}>{error}</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="wait-cancel-btn"
              style={{ background: "#63b374", borderColor: "#63b374", color: "#fff" }}
              onClick={handleRetry}>Retry</button>
            <button className="wait-cancel-btn" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 1: difficulty selection ────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="diff-select-page">
        <div className="land-grid-bg" />
        <div className="diff-select-inner">
          <h1 className="diff-select-title">Choose Difficulty</h1>
          <p className="diff-select-sub">
            Match with a developer at your level. ELO-based pairing keeps games fair.
          </p>

          <div className="diff-cards-grid">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                className="diff-card"
                style={{ "--dc-color": d.color, "--dc-bg": d.bg, "--dc-border": d.border }}
                onClick={() => handleSelectDifficulty(d.id)}
              >
                <span className="dc-emoji">{d.emoji}</span>
                <span className="dc-label">{d.label}</span>
                <span className="dc-desc">{d.desc}</span>
                <div className="dc-footer">
                  <span className="dc-queue">
                    <span className="dc-live-dot" />
                    {queueCounts[d.id] ?? 0} waiting
                  </span>
                  <span className="dc-avg">{d.avgWait}</span>
                </div>
              </button>
            ))}
          </div>

          <button className="wait-cancel-btn" style={{ marginTop: "0.5rem" }} onClick={handleCancel}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Phase 2: waiting for match ───────────────────────────────────────────────
  return (
    <div className="wait-page">
      <div className="wait-card">
        <div className="wait-spinner">
          <div className="spinner-ring outer" style={{ borderTopColor: selConfig?.color }} />
          <div className="spinner-ring inner" />
          <div className="spinner-core"><span>CM</span></div>
        </div>

        <div className="wait-title-row">
          <h2 className="wait-title">Finding your match...</h2>
          {selConfig && (
            <span className="diff-inline-badge" style={{
              color:      selConfig.color,
              background: selConfig.bg,
              border:     `1px solid ${selConfig.border}`,
            }}>
              {selConfig.emoji} {selConfig.label}
            </span>
          )}
        </div>

        <div className="wait-meta">
          <div className="meta-item">
            <span className="meta-label">Wait Time</span>
            <span className="meta-value">{formatTime(waitTime)}</span>
          </div>
          <div className="meta-divider" />
          <div className="meta-item">
            <span className="meta-label">In Queue</span>
            <span className="meta-value">{queueCounts[selectedDiff] ?? 0}</span>
          </div>
        </div>

        <p className="wait-hint">Matching developers within ±300 ELO of your rating.</p>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="wait-cancel-btn" onClick={handleChangeDifficulty}>
            ← Change
          </button>
          <button className="wait-cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
