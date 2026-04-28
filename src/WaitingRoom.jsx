import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./components.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

export default function WaitingRoom({ onMatchFound, onCancel }) {
  const socketRef  = useRef(null);
  const matchedRef = useRef(false); // prevents socket disconnect if match fired first

  const [queueCount, setQueueCount] = useState(0);
  const [waitTime,   setWaitTime]   = useState(0);
  const [error,      setError]      = useState(null);
  const [retryKey,   setRetryKey]   = useState(0); // bump to re-run the connect effect

  // ── Socket connection ───────────────────────────────────────────────────────
  useEffect(() => {
    matchedRef.current = false;
    setError(null);

    // Railway (and most proxied hosts) needs polling as a fallback transport.
    // Socket.io will upgrade to websocket automatically after the initial handshake.
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      allowEIO3: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WaitingRoom] Connected:", socket.id);
      setError(null);
      socket.emit("find_match");
    });

    socket.on("connect_error", (err) => {
      console.error("[WaitingRoom] Connection error:", err.message);
      setError(`Could not reach server: ${err.message}`);
    });

    // Server paired us with a partner
    socket.on("match_found", (data) => {
      console.log("[WaitingRoom] match_found:", data);
      matchedRef.current = true;
      // Pass the live socket to EditorRoom so it can reuse the same connection
      onMatchFound({ ...data, socket });
    });

    socket.on("queue_update", ({ count }) => {
      setQueueCount(count);
    });

    // Cleanup: only disconnect if we were NOT matched (match = socket handed to EditorRoom)
    return () => {
      if (!matchedRef.current) {
        socket.emit("cancel_match");
        socket.disconnect();
      }
    };
  }, [retryKey, onMatchFound]);

  // ── Wait timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setWaitTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [retryKey]); // reset timer on retry

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  }

  function handleCancel() {
    socketRef.current?.emit("cancel_match");
    socketRef.current?.disconnect();
    onCancel();
  }

  function handleRetry() {
    setWaitTime(0);
    setRetryKey((k) => k + 1); // triggers effect re-run → new socket
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="wait-page">
        <div className="wait-card">
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 className="wait-title" style={{ color: "#e07070" }}>Connection Failed</h2>
          <p className="wait-hint" style={{ color: "#e07070", marginBottom: "1.5rem" }}>
            {error}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button className="wait-cancel-btn" onClick={handleRetry}
              style={{ background: "#63b374", borderColor: "#63b374", color: "#fff" }}>
              Retry
            </button>
            <button className="wait-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal waiting state ────────────────────────────────────────────────────
  return (
    <div className="wait-page">
      <div className="wait-card">
        <div className="wait-spinner">
          <div className="spinner-ring outer" />
          <div className="spinner-ring inner" />
          <div className="spinner-core">
            <span>CM</span>
          </div>
        </div>

        <h2 className="wait-title">Finding your match...</h2>

        <div className="wait-meta">
          <div className="meta-item">
            <span className="meta-label">Wait Time</span>
            <span className="meta-value">{formatTime(waitTime)}</span>
          </div>
          <div className="meta-divider" />
          <div className="meta-item">
            <span className="meta-label">In Queue</span>
            <span className="meta-value">{queueCount}</span>
          </div>
        </div>

        <p className="wait-hint">
          You'll be matched with a random developer instantly.
        </p>

        <button className="wait-cancel-btn" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
