import { useCallback, useState } from "react";
import { ChatInput } from "./components/ChatInput.tsx";
import { MessageList } from "./components/MessageList.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { ErrorBanner } from "./components/ErrorBanner.tsx";
import { useChat } from "./hooks/useChat.ts";
import { useHealth } from "./hooks/useHealth.ts";
import { resetSession } from "./api/client.ts";

const DEFAULT_SESSION_KEY = "webchat:main";
const DEFAULT_TOKEN = import.meta.env.VITE_DAEMON_TOKEN as string || "dev";

function App() {
  const [sessionKey] = useState(DEFAULT_SESSION_KEY);
  const [token] = useState(DEFAULT_TOKEN);

  const { messages, streaming, send, abort, clearMessages, error: chatError, clearError } = useChat(
    sessionKey,
    token
  );
  const { health, error: healthError } = useHealth();

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
          <span className="text-xs text-zinc-600 font-mono">{sessionKey}</span>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
        >
          Reset Session
        </button>
      </header>

      {/* Error Banner */}
      <ErrorBanner error={chatError || healthError} onDismiss={clearError} />

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <ChatInput onSend={send} disabled={streaming} onAbort={abort} />

      {/* Status bar */}
      <StatusBar health={health} healthError={healthError} messages={messages} />
    </div>
  );
}

export default App;
