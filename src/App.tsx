import { useCallback, useState, useEffect } from "react";
import { ChatInput } from "./components/ChatInput.tsx";
import { MessageList } from "./components/MessageList.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { ErrorBanner } from "./components/ErrorBanner.tsx";
import { SessionSidebar } from "./components/SessionSidebar.tsx";
import { useChat } from "./hooks/useChat.ts";
import { useHealth } from "./hooks/useHealth.ts";
import { useTokenValidation } from "./hooks/useTokenValidation.ts";
import { useSessionManager } from "./hooks/useSessionManager.ts";
import { resetSession } from "./api/client.ts";

const DEFAULT_TOKEN = import.meta.env.VITE_DAEMON_TOKEN as string || "dev";
const UI_VERSION = "0.0.1";

function App() {
  const [token] = useState(DEFAULT_TOKEN);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Session management
  const {
    activeSessionKey,
    setActiveSessionKey,
    addSession,
    updateSessionMessages,
    clearSessionMessages,
    sessionsMetadata,
  } = useSessionManager();

  const { messages, streaming, loadingHistory, send, abort, clearMessages, loadHistory, error: chatError, clearError } = useChat(
    activeSessionKey,
    token
  );
  const { health, error: healthError } = useHealth();
  const tokenValidation = useTokenValidation(activeSessionKey, token);

  // Load history on initial mount and when session changes
  useEffect(() => {
    loadHistory();
  }, [activeSessionKey, loadHistory]);

  // Update session messages whenever messages change
  useEffect(() => {
    updateSessionMessages(activeSessionKey, messages);
  }, [activeSessionKey, messages, updateSessionMessages]);

  const handleSessionSwitch = useCallback((sessionKey: string) => {
    setActiveSessionKey(sessionKey);
    // Load history for the new session
    loadHistory();
  }, [setActiveSessionKey, loadHistory]);

  const handleSessionCreate = useCallback((sessionKey: string) => {
    addSession(sessionKey);
  }, [addSession]);

  const handleSessionReset = useCallback(async (sessionKey: string) => {
    try {
      await resetSession(sessionKey, token);
      clearSessionMessages(sessionKey);
      if (sessionKey === activeSessionKey) {
        clearMessages();
      }
    } catch (err) {
      console.error("Reset failed:", err);
    }
  }, [token, clearSessionMessages, activeSessionKey, clearMessages]);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold tracking-tight text-zinc-200">
            daemon-engine
          </h1>
          <span className="text-xs text-zinc-500 font-mono">v{UI_VERSION}</span>
          <span className="text-xs text-zinc-600 font-mono">{activeSessionKey}</span>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Session Sidebar */}
        <SessionSidebar
          sessions={sessionsMetadata}
          activeSessionKey={activeSessionKey}
          onSessionSelect={handleSessionSwitch}
          onSessionReset={handleSessionReset}
          onSessionCreate={handleSessionCreate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Error Banner */}
          <ErrorBanner 
            error={
              tokenValidation.error || 
              chatError || 
              healthError || 
              undefined
            } 
            onDismiss={clearError} 
          />
          
          {/* Loading indicator during validation */}
          {tokenValidation.checking && (
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-xs text-zinc-400 text-center">
              Validating connection and token...
            </div>
          )}

          {/* Messages */}
          <MessageList messages={messages} loadingHistory={loadingHistory} />

          {/* Input */}
          <ChatInput onSend={send} disabled={streaming} onAbort={abort} />

          {/* Status bar */}
          <StatusBar health={health} healthError={healthError} messages={messages} />
        </div>
      </div>
    </div>
  );
}

export default App;
