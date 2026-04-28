import { useRef, useState, useEffect } from "react";
import Landing      from "./Landing";
import WaitingRoom  from "./WaitingRoom";
import EditorRoom   from "./EditorRoom";
import ProblemsPage from "./ProblemsPage";
import { useAuth }  from "./context/AuthContext";
import "./global.css";

export default function App() {
  const [screen, setScreen]       = useState("landing"); // "landing" | "problems" | "waiting" | "editor"
  const [matchData, setMatchData] = useState(null);
  const { login } = useAuth();

  // Handle Google OAuth callback: /auth/callback?token=...
  useEffect(() => {
    if (window.location.pathname === "/auth/callback") {
      const params = new URLSearchParams(window.location.search);
      const token  = params.get("token");
      if (token) {
        login(token);
      }
      // Clean URL without reload
      window.history.replaceState({}, "", "/");
    }
  }, [login]);

  // Keep a ref to the active socket so we can disconnect it from any screen
  const socketRef = useRef(null);

  function handleFindMatch() {
    setScreen("waiting");
  }

  function handleMatchFound(data) {
    // data = { roomId, problem, opponentId, socket }
    socketRef.current = data.socket;
    setMatchData(data);
    setScreen("editor");
  }

  function handleLeave() {
    // Always close the socket before returning to landing
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setMatchData(null);
    setScreen("landing");
  }

  return (
    <div className="app-root">
      {screen === "landing" && (
        <Landing
          onFindMatch={handleFindMatch}
          onProblems={() => setScreen("problems")}
        />
      )}

      {screen === "problems" && (
        <ProblemsPage
          onFindMatch={handleFindMatch}
          onBack={() => setScreen("landing")}
        />
      )}

      {screen === "waiting" && (
        <WaitingRoom
          onMatchFound={handleMatchFound}
          onCancel={handleLeave}
        />
      )}

      {screen === "editor" && (
        <EditorRoom
          matchData={matchData}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
