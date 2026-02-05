import { useCallback, useEffect, useState } from "react";
import { ChatInput } from "./components/ChatInput.tsx";
import { MessageList } from "./components/MessageList.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { ObservabilityPanel } from "./components/ObservabilityPanel.tsx";
import { useChat } from "./hooks/useChat.ts";
import { useStatus } from "./hooks/useStatus.ts";
import { resetSession } from "./api/client.ts";

const DEFAULT_SESSION_KEY = "webchat:main";
const DEFAULT_TOKEN = import.meta.env.VITE_DAEMON_TOKEN as string || "dev";

function App() {
  // Get session key from URL query param or use default
  const [sessionKey, setSessionKey] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("session") || DEFAULT_SESSION_KEY;
  });
  const [token] = useState(DEFAULT_TOKEN);
  const [showObservability, setShowObservability] = useState(false);

  const { messages, streaming, loadingHistory, send, abort, clearMessages } =
    useChat(sessionKey, token);
  const { status, error: statusError } = useStatus(token);

  // Update URL when session key changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (sessionKey !== DEFAULT_SESSION_KEY) {
      params.set("session", sessionKey);
    } else {
      params.delete("session");
    }
    const newUrl =
      params.toString() === ""
        ? window.location.pathname
        : `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [sessionKey]);

  const handleReset = useCallback(async () => {
    try {
      await resetSession(sessionKey, token);
      clearMessages();
    } catch (err) {
      console.error("Reset failed:", err);
    }
  }, [sessionKey, token, clearMessages]);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold tracking-tight text-zinc-200">
            daemon-engine
          </h1>
          <input
            type="text"
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
            className="text-xs text-zinc-300 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 font-mono focus:outline-none focus:border-indigo-500 w-32"
            placeholder="session key"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowObservability(true)}
            className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
          >
            Observability
          </button>
          <button
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
          >
            Reset Session
          </button>
        </div>
      </header>

      {/* Messages */}
      <MessageList messages={messages} loadingHistory={loadingHistory} />

      {/* Input */}
      <ChatInput onSend={send} disabled={streaming} onAbort={abort} />

      {/* Status bar */}
      <StatusBar
        status={status}
        statusError={statusError}
        messages={messages}
      />

      {/* Observability Panel */}
      <ObservabilityPanel
        token={token}
        isOpen={showObservability}
        onClose={() => setShowObservability(false)}
      />
    </div>
  );
}

export default App;
