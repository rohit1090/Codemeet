import { useRef, useState, useEffect } from "react";
import Landing          from "./Landing";
import WaitingRoom      from "./WaitingRoom";
import EditorRoom       from "./EditorRoom";
import ProblemsPage     from "./ProblemsPage";
import LeaderboardPage  from "./LeaderboardPage";
import LoginPromptModal from "./LoginPromptModal";
import { useAuth }      from "./context/AuthContext";
import "./global.css";

const GUEST_MATCH_KEY  = "codemeet_guest_matches";
const GUEST_MATCH_LIMIT = 5;

function getGuestMatches() {
  return parseInt(localStorage.getItem(GUEST_MATCH_KEY) || "0", 10);
}
function incrementGuestMatches() {
  const next = getGuestMatches() + 1;
  localStorage.setItem(GUEST_MATCH_KEY, String(next));
  return next;
}

export default function App() {
  const [screen, setScreen]                   = useState("landing");
  const [matchData, setMatchData]             = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [rematchDifficulty, setRematchDifficulty] = useState(null);
  const prevScreen = useRef("landing"); // so leaderboard can go back to right place
  const socketRef = useRef(null);
  const { login, user } = useAuth();

  // Handle Google OAuth callback: /auth/callback?token=...
  useEffect(() => {
    if (window.location.pathname === "/auth/callback") {
      const params = new URLSearchParams(window.location.search);
      const token  = params.get("token");
      if (token) {
        login(token);
      }
      window.history.replaceState({}, "", "/");
    }
  }, [login]);

  function handleFindMatch() {
    setRematchDifficulty(null); // show difficulty selection screen normally
    if (user) {
      setScreen("waiting");
      return;
    }
    if (getGuestMatches() >= GUEST_MATCH_LIMIT) {
      setShowLoginPrompt(true);
      return;
    }
    setScreen("waiting");
  }

  function handleMatchFound(data) {
    socketRef.current = data.socket;
    setMatchData(data);
    setScreen("editor");

    // Count this match for guest users
    if (!user) {
      const used = incrementGuestMatches();
      // Pre-emptively show the modal after leaving if they've hit the limit
      if (used >= GUEST_MATCH_LIMIT) {
        // will show next time they click Find a Match
      }
    }
  }

  function handleLeave() {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setMatchData(null);
    setRematchDifficulty(null);
    setScreen("landing");

    // Show login prompt immediately after the session ends if limit reached
    if (!user && getGuestMatches() >= GUEST_MATCH_LIMIT) {
      setShowLoginPrompt(true);
    }
  }

  // Called by EditorRoom overlays — receives difficulty directly so there's no
  // stale-closure risk from reading App state inside this function.
  function handleFindNewMatch(difficulty) {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setMatchData(null);
    setRematchDifficulty(difficulty || null);

    if (!user && getGuestMatches() >= GUEST_MATCH_LIMIT) {
      setShowLoginPrompt(true);
      return;
    }

    setScreen("waiting");
  }

  function goToLeaderboard() {
    prevScreen.current = screen;
    setScreen("leaderboard");
  }

  return (
    <div className="app-root">
      {screen === "landing" && (
        <Landing
          onFindMatch={handleFindMatch}
          onProblems={() => setScreen("problems")}
          onLeaderboard={goToLeaderboard}
        />
      )}

      {screen === "problems" && (
        <ProblemsPage
          onFindMatch={handleFindMatch}
          onBack={() => setScreen("landing")}
          onLeaderboard={goToLeaderboard}
        />
      )}

      {screen === "leaderboard" && (
        <LeaderboardPage
          onBack={() => setScreen(prevScreen.current === "editor" ? "landing" : (prevScreen.current || "landing"))}
          onFindMatch={handleFindMatch}
        />
      )}

      {screen === "waiting" && (
        <WaitingRoom
          onMatchFound={handleMatchFound}
          onCancel={handleLeave}
          initialDifficulty={rematchDifficulty}
        />
      )}

      {screen === "editor" && (
        <EditorRoom
          matchData={matchData}
          onLeave={handleLeave}
          onFindNewMatch={handleFindNewMatch}
          onLeaderboard={goToLeaderboard}
        />
      )}

      {showLoginPrompt && (
        <LoginPromptModal
          matchesUsed={GUEST_MATCH_LIMIT}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
}
