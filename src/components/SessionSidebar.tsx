import { useState, useCallback } from "react";
import type { SessionMetadata } from "../hooks/useSessionManager.ts";

interface Props {
  sessions: SessionMetadata[];
  activeSessionKey: string;
  onSessionSelect: (sessionKey: string) => void;
  onSessionReset: (sessionKey: string) => void;
  onSessionCreate: (sessionKey: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return "Never";
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function formatTokens(count: number): string {
  if (count === 0) return "0";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function SessionSidebar({
  sessions,
  activeSessionKey,
  onSessionSelect,
  onSessionReset,
  onSessionCreate,
  collapsed,
  onToggleCollapse,
}: Props) {
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [newSessionKey, setNewSessionKey] = useState("");

  const handleCreateSession = useCallback(() => {
    if (!newSessionKey.trim()) return;
    onSessionCreate(newSessionKey.trim());
    setNewSessionKey("");
    setShowNewSessionInput(false);
  }, [newSessionKey, onSessionCreate]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleCreateSession();
      } else if (e.key === "Escape") {
        setShowNewSessionInput(false);
        setNewSessionKey("");
      }
    },
    [handleCreateSession]
  );

  return (
    <div
      className={`border-r border-zinc-800 bg-zinc-900 flex flex-col transition-all duration-200 ${
        collapsed ? "w-12" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        {!collapsed && (
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
            Sessions
          </h2>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {collapsed ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            )}
          </svg>
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Session List */}
          <div className="flex-1 overflow-y-auto">
            {sessions.map((session) => {
              const isActive = session.sessionKey === activeSessionKey;
              const totalTokens =
                session.totalInputTokens +
                session.totalOutputTokens +
                session.totalCacheReadTokens;

              return (
                <div
                  key={session.sessionKey}
                  className={`border-b border-zinc-800 ${
                    isActive ? "bg-indigo-950/40" : "hover:bg-zinc-800/50"
                  } transition-colors cursor-pointer`}
                  onClick={() => onSessionSelect(session.sessionKey)}
                >
                  <div className="px-3 py-2">
                    {/* Session Key */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            isActive ? "bg-indigo-500" : "bg-zinc-600"
                          }`}
                        />
                        <span
                          className={`text-xs font-mono truncate ${
                            isActive
                              ? "text-indigo-300 font-medium"
                              : "text-zinc-300"
                          }`}
                          title={session.sessionKey}
                        >
                          {session.sessionKey}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="text-[10px] text-zinc-500 font-mono space-y-0.5 ml-3.5">
                      <div className="flex items-center justify-between">
                        <span>{session.messageCount} msgs</span>
                        <span>{formatTimestamp(session.lastActive)}</span>
                      </div>
                      {totalTokens > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-600">tok:</span>
                          <span>{formatTokens(totalTokens)}</span>
                        </div>
                      )}
                    </div>

                    {/* Reset Button */}
                    {isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSessionReset(session.sessionKey);
                        }}
                        className="mt-2 w-full text-[10px] text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800/50 border border-zinc-700 hover:border-red-800"
                      >
                        Reset Session
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Session Button */}
          <div className="border-t border-zinc-800 p-3">
            {showNewSessionInput ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newSessionKey}
                  onChange={(e) => setNewSessionKey(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="session:key"
                  className="w-full px-2 py-1.5 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateSession}
                    className="flex-1 text-xs px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewSessionInput(false);
                      setNewSessionKey("");
                    }}
                    className="flex-1 text-xs px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewSessionInput(true)}
                className="w-full text-xs px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors border border-zinc-700 hover:border-indigo-700"
              >
                + New Session
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
