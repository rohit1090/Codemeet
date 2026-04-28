import { useEffect, useRef, useCallback } from "react";

/**
 * Manages real-time code and language synchronisation between two users.
 *
 * @param {object} opts
 * @param {Socket}   opts.socket           – active Socket.io socket
 * @param {string}   opts.roomId           – current room ID
 * @param {React.MutableRefObject} opts.editorRef – ref pointing at Monaco editor instance
 * @param {function} opts.onLanguageChange – called with languageValue when partner switches language
 *
 * @returns {{ syncCode: function }} syncCode(code) – call this from Monaco onChange
 */
export function useCodeSync({ socket, roomId, editorRef, onLanguageChange }) {
  // Prevents echoing partner's edits back to the server
  const suppressRef  = useRef(false);
  const debounceRef  = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Partner typed → update local Monaco editor
    socket.on("code_update", ({ code }) => {
      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      if (!model || model.getValue() === code) return;

      console.log("[CodeSync] Received code_update");

      // Save cursor so it doesn't jump on setValue
      const position = editor.getPosition();
      suppressRef.current = true;   // stop onChange from re-emitting
      model.setValue(code);
      suppressRef.current = false;
      if (position) editor.setPosition(position);
    });

    // Partner switched language
    socket.on("language_update", ({ languageValue }) => {
      console.log("[CodeSync] Received language_update:", languageValue);
      onLanguageChange?.(languageValue);
    });

    return () => {
      socket.off("code_update");
      socket.off("language_update");
      clearTimeout(debounceRef.current);
    };
  }, [socket, editorRef, onLanguageChange]);

  // Debounced emitter — 50 ms to avoid flooding the server on every keystroke
  const syncCode = useCallback(
    (code) => {
      if (suppressRef.current) return; // this change came from partner, don't echo

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        socket?.emit("code_change", { roomId, code });
      }, 50);
    },
    [socket, roomId]
  );

  return { syncCode };
}
