import { useEffect, useRef, useState } from "react";
import "./components.css";

export default function ChatPanel({ roomId, socket }) {
  const [messages, setMessages] = useState([
    // Seed one system message so chat isn't empty
    { id: 0, type: "system", text: "You've been matched! Start collaborating." },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Receive messages from partner
  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", ({ text, senderId }) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), type: "them", text, senderId },
      ]);
    });

    return () => socket.off("receive_message");
  }, [socket]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    // Add to local state immediately (optimistic)
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "me", text },
    ]);

    // Emit to server → forwarded to partner
    socket.emit("send_message", { roomId, text });

    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span className="chat-dot online" />
        Chat
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          if (msg.type === "system") {
            return (
              <div className="chat-system" key={msg.id}>{msg.text}</div>
            );
          }
          return (
            <div className={`chat-bubble-wrap ${msg.type}`} key={msg.id}>
              <div className="chat-sender">
                {msg.type === "me" ? "You" : "Partner"}
              </div>
              <div className={`chat-bubble ${msg.type}`}>{msg.text}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          placeholder="Message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={300}
        />
        <button className="chat-send-btn" onClick={sendMessage}>
          ↑
        </button>
      </div>
    </div>
  );
}
