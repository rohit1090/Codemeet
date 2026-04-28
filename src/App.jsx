import { useRef, useState } from "react";
import Landing    from "./Landing";
import WaitingRoom from "./WaitingRoom";
import EditorRoom  from "./EditorRoom";
import "./global.css";

export default function App() {
  const [screen, setScreen]       = useState("landing"); // "landing" | "waiting" | "editor"
  const [matchData, setMatchData] = useState(null);

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
        <Landing onFindMatch={handleFindMatch} />
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
